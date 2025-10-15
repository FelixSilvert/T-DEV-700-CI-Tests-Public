import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Team } from "../teams/entities/team.entity";
import { User } from "../users/entities/user.entity";
import { GenerateReportDto, ReportScope, AvailableKpi } from "./dto/generate-report.dto";
import { ReportResponse, KpiResult } from "./interface/reports.interface";
import { KpiCalculatorService } from "./services/kpi-calculator.service";


@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    private readonly kpiCalculator: KpiCalculatorService,
  ) {}

  async generateReport(dto: GenerateReportDto): Promise<ReportResponse> {
    this.validateDates(dto.from, dto.to);
    this.validateScope(dto.scope, dto.userId, dto.teamId);

    const fromDate = new Date(dto.from);
    const toDate = new Date(dto.to);

    try {
      const { users, targetName } = await this.getUsers(dto.scope, dto.userId, dto.teamId);

      if (users.length === 0) {
        throw new NotFoundException("No users found");
      }

      const kpis = this.computeKpis(dto.kpis, users, fromDate, toDate);

      return {
        scope: dto.scope || ReportScope.GLOBAL,
        from: dto.from,
        to: dto.to,
        targetId: dto.scope === ReportScope.USER ? dto.userId || null : dto.scope === ReportScope.TEAM ? dto.teamId || null : null,
        targetName,
        kpis,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Error generating report", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException("Report generation failed", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  getAvailableKpis() {
    return [
      { kpi: AvailableKpi.HOURS_WORKED, description: "Total hours worked", unit: "hours" },
      { kpi: AvailableKpi.LATE_HOURS, description: "Total late hours", unit: "hours" },
      { kpi: AvailableKpi.AVERAGE_HOURS_PER_DAY, description: "Average hours per day worked", unit: "hours/day" },
      { kpi: AvailableKpi.WORKED_DAYS, description: "Number of days worked", unit: "days" },
      { kpi: AvailableKpi.ABSENCES, description: "Number of absent days", unit: "days" },
    ];
  }

  // ==================== PRIVATE ====================

  private validateDates(from: string, to: string): void {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate > toDate) {
      throw new BadRequestException("'from' must be before 'to'");
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (toDate > tomorrow) {
      throw new BadRequestException("Cannot generate reports for future dates");
    }
  }

  private validateScope(scope: ReportScope = ReportScope.GLOBAL, userId?: string, teamId?: string): void {
    if (scope === ReportScope.USER && !userId) {
      throw new BadRequestException("userId required when scope=user");
    }
    if (scope === ReportScope.TEAM && !teamId) {
      throw new BadRequestException("teamId required when scope=team");
    }
  }

  private async getUsers(
    scope: ReportScope = ReportScope.GLOBAL,
    userId?: string,
    teamId?: string,
  ): Promise<{ users: User[]; targetName: string }> {
    if (scope === ReportScope.USER && userId) {
      const user = await this.userRepo.findOne({ where: { id: userId }, relations: ["clocks"] });
      if (!user) throw new NotFoundException("User not found");
      return { users: [user], targetName: `${user.firstName} ${user.lastName}` };
    }

    if (scope === ReportScope.TEAM && teamId) {
      const team = await this.teamRepo.findOne({ where: { id: teamId }, relations: ["members", "members.clocks"] });
      if (!team) throw new NotFoundException("Team not found");
      return { users: team.members, targetName: team.name };
    }

    const users = await this.userRepo.find({ relations: ["clocks"] });
    return { users, targetName: "All Users" };
  }

  private computeKpis(kpis: AvailableKpi[], users: User[], from: Date, to: Date): Record<string, KpiResult> {
    const results: Record<string, KpiResult> = {};

    const handlers: Record<AvailableKpi, () => KpiResult> = {
      [AvailableKpi.HOURS_WORKED]: () => this.kpiCalculator.calculateHoursWorked(users, from, to),
      [AvailableKpi.LATE_HOURS]: () => this.kpiCalculator.calculateLateHours(users, from, to),
      [AvailableKpi.AVERAGE_HOURS_PER_DAY]: () => this.kpiCalculator.calculateAverageHoursPerDay(users, from, to),
      [AvailableKpi.WORKED_DAYS]: () => this.kpiCalculator.calculateWorkedDays(users, from, to),
      [AvailableKpi.ABSENCES]: () => this.kpiCalculator.calculateAbsences(users, from, to),
    };

    for (const kpi of kpis) {
      const handler = handlers[kpi];
      if (handler) {
        results[kpi] = handler();
      }
    }

    return results;
  }
}