import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { Team } from "../teams/entities/team.entity";
import { Clock } from "../clocks/entities/clock.entity";

export type ReportScope = "user" | "team" | "global";

interface ReportRequest {
  from: string;
  to: string;
  kpis: string[];
  scope: ReportScope;
  userId?: string;
  teamId?: string;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(Clock)
    private readonly clockRepo: Repository<Clock>,
  ) {}

  async generateReport(req: ReportRequest) {
    const { from, to, kpis, scope, userId, teamId } = req;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    try {
      const users = await this.getUsersByScope(scope, userId, teamId);
      const results = this.computeKpis(kpis, users, fromDate, toDate);
      const team = scope === "team" ? teamId : null;

      return {
        scope,
        from,
        to,
        targetId: scope === "user" ? userId : team,
        kpis: results,
      };
    } catch (error) {
      this.logger.error("Error generating report", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("An error occurred while generating the report", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getUsersByScope(scope: ReportScope, userId?: string, teamId?: string): Promise<User[]> {
    if (scope === "user" && userId) {
      const user = await this.userRepo.findOne({ where: { id: userId }, relations: ["clocks"] });
      if (!user) throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      return [user];
    }

    if (scope === "team" && teamId) {
      const team = await this.teamRepo.findOne({
        where: { id: teamId },
        relations: ["members", "members.clocks"],
      });
      if (!team) throw new HttpException("Team not found", HttpStatus.NOT_FOUND);
      return team.members;
    }

    return this.userRepo.find({ relations: ["clocks"] });
  }

  private computeKpis(kpis: string[], users: User[], from: Date, to: Date): Record<string, any> {
    const results: Record<string, any> = {};

    for (const kpi of kpis) {
      results[kpi] = this.dispatchKpi(kpi, users, from, to);
    }

    return results;
  }

  private dispatchKpi(kpi: string, users: User[], from: Date, to: Date): any {
    const kpiHandlers: Record<string, () => any> = {
      hoursWorked: () => this.calculateHoursWorked(users, from, to),
      lateCount: () => this.calculateLateCount(users, from, to),
      absences: () => this.calculateAbsences(users, from, to),
    };

    const handler = kpiHandlers[kpi];
    if (!handler) {
      this.logger.warn(`KPI ${kpi} not recognized`);
      return null;
    }

    return handler();
  }

  private calculateHoursWorked(users: User[], from: Date, to: Date): number {
    return users.reduce((total, user) => {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      return total + clocks.length * 8;
    }, 0);
  }

  private calculateLateCount(users: User[], from: Date, to: Date): number {
    const LATE_HOUR = 9;
    return users.reduce((count, user) => {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      return (
        count +
        clocks.filter(clock => new Date(clock.date).getHours() > LATE_HOUR).length
      );
    }, 0);
  }

  private calculateAbsences(users: User[], from: Date, to: Date): number {
    return users.reduce((abs, user) => {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      return abs + (clocks.length === 0 ? 1 : 0);
    }, 0);
  }

  private filterClocksByDate(clocks: Clock[], from: Date, to: Date): Clock[] {
    return clocks.filter(clock => clock.date >= from && clock.date <= to);
  }
}
