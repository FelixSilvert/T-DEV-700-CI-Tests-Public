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
import { User } from "../users/entities/user.entity";
import { Team } from "../teams/entities/team.entity";
import { KpiCalculatorService, KpiResult } from "./services/kpi-calculator.service";
import { GenerateReportDto, ReportScope, AvailableKpi } from "./dto/generate-report.dto";
import { ReportResponse } from "./interface/reports.interface";

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

  /**
   * Génère un rapport avec les KPIs demandés
   */
  async generateReport(dto: GenerateReportDto): Promise<ReportResponse> {
    this.logger.log(`Generating report: ${JSON.stringify(dto)}`);

    this.validateReportRequest(dto);

    const { from, to, kpis, scope = ReportScope.GLOBAL, userId, teamId } = dto;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    this.logger.debug(`From: ${fromDate.toISOString()}, To: ${toDate.toISOString()}`);

    try {
      const { users, targetName } = await this.getUsersByScope(scope, userId, teamId);

      if (users.length === 0) {
        throw new NotFoundException("No users found for the specified scope");
      }

      const kpiResults = this.computeKpis(kpis, users, fromDate, toDate);
      const periodInfo = this.calculatePeriodInfo(fromDate, toDate);

      return {
        scope,
        from,
        to,
        targetId: this.getTargetId(scope, userId, teamId),
        targetName,
        periodInfo,
        kpis: kpiResults,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error("Error generating report", error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "An error occurred while generating the report",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Valide la requête de rapport
   * ✅ FIX: Validation des dates futures corrigée pour prendre en compte le fuseau horaire
   */
  private validateReportRequest(dto: GenerateReportDto): void {
    const { from, to, scope, userId, teamId } = dto;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Valider que from est avant to
    if (fromDate > toDate) {
      throw new BadRequestException("'from' date must be before 'to' date");
    }

    // Valider que les dates ne sont pas trop anciennes (> 2 ans)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    if (fromDate < twoYearsAgo) {
      throw new BadRequestException("Cannot generate reports for dates older than 2 years");
    }

    // ✅ FIX: Valider que les dates ne sont pas dans le futur
    // On ajoute une marge de 24h pour éviter les problèmes de fuseau horaire
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    this.logger.debug(`Current time: ${now.toISOString()}`);
    this.logger.debug(`Tomorrow: ${tomorrow.toISOString()}`);
    this.logger.debug(`From date: ${fromDate.toISOString()}`);
    this.logger.debug(`To date: ${toDate.toISOString()}`);

    if (fromDate > tomorrow) {
      throw new BadRequestException(
        `Cannot generate reports for future dates. From date: ${fromDate.toISOString()}, Current time: ${now.toISOString()}`
      );
    }

    if (toDate > tomorrow) {
      throw new BadRequestException(
        `Cannot generate reports for future dates. To date: ${toDate.toISOString()}, Current time: ${now.toISOString()}`
      );
    }

    // Valider les paramètres selon le scope
    if (scope === ReportScope.USER && !userId) {
      throw new BadRequestException("userId is required when scope is 'user'");
    }

    if (scope === ReportScope.TEAM && !teamId) {
      throw new BadRequestException("teamId is required when scope is 'team'");
    }

    // Valider qu'au moins un KPI est demandé
    if (!dto.kpis || dto.kpis.length === 0) {
      throw new BadRequestException("At least one KPI must be specified");
    }
  }

  /**
   * Récupère les utilisateurs selon le scope
   */
  private async getUsersByScope(
    scope: ReportScope,
    userId?: string,
    teamId?: string,
  ): Promise<{ users: User[]; targetName?: string }> {
    if (scope === ReportScope.USER && userId) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ["clocks"],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      return {
        users: [user],
        targetName: user.email || `User ${userId}`,
      };
    }

    if (scope === ReportScope.TEAM && teamId) {
      const team = await this.teamRepo.findOne({
        where: { id: teamId },
        relations: ["members", "members.clocks"],
      });

      if (!team) {
        throw new NotFoundException(`Team with ID ${teamId} not found`);
      }

      return {
        users: team.members,
        targetName: team.name || `Team ${teamId}`,
      };
    }

    // Scope global
    const users = await this.userRepo.find({ relations: ["clocks"] });

    return {
      users,
      targetName: "Global - All Users",
    };
  }

  /**
   * Calcule tous les KPIs demandés
   */
  private computeKpis(
    kpis: AvailableKpi[],
    users: User[],
    from: Date,
    to: Date,
  ): Record<string, KpiResult> {
    const results: Record<string, KpiResult> = {};

    const kpiHandlers: Record<AvailableKpi, () => KpiResult> = {
      [AvailableKpi.HOURS_WORKED]: () =>
        this.kpiCalculator.calculateHoursWorked(users, from, to),
      [AvailableKpi.AVERAGE_HOURS_PER_USER]: () =>
        this.kpiCalculator.calculateAverageHoursPerUser(users, from, to),
      [AvailableKpi.LATE_COUNT]: () =>
        this.kpiCalculator.calculateLateCount(users, from, to),
      [AvailableKpi.ABSENCES]: () =>
        this.kpiCalculator.calculateAbsences(users, from, to),
      [AvailableKpi.LUNCH_BREAKS]: () =>
        this.kpiCalculator.calculateLunchBreaks(users, from, to),
      [AvailableKpi.WORKED_DAYS]: () =>
        this.kpiCalculator.calculateWorkedDays(users, from, to),
      [AvailableKpi.ACTIVE_USERS]: () =>
        this.kpiCalculator.calculateActiveUsers(users, from, to),
    };

    for (const kpi of kpis) {
      const handler = kpiHandlers[kpi];
      if (handler) {
        try {
          results[kpi] = handler();
        } catch (error) {
          this.logger.error(`Error calculating KPI ${kpi}:`, error);
          results[kpi] = {
            value: 0,
            unit: "error",
            details: { error: "Calculation failed" },
          };
        }
      } else {
        this.logger.warn(`KPI ${kpi} not recognized`);
      }
    }

    return results;
  }

  /**
   * Calcule les informations sur la période
   */
  private calculatePeriodInfo(from: Date, to: Date): { totalDays: number; workingDays: number } {
    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.ceil((to.getTime() - from.getTime()) / msPerDay) + 1;

    // Calculer les jours ouvrés
    let workingDays = 0;
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return { totalDays, workingDays };
  }

  /**
   * Retourne l'ID de la cible selon le scope
   */
  private getTargetId(scope: ReportScope, userId?: string, teamId?: string): string | null {
    if (scope === ReportScope.USER) return userId || null;
    if (scope === ReportScope.TEAM) return teamId || null;
    return null;
  }

  /**
   * Liste tous les KPIs disponibles
   */
  getAvailableKpis(): { kpi: string; description: string; unit: string }[] {
    return [
      {
        kpi: AvailableKpi.HOURS_WORKED,
        description: "Total hours worked (arrival to departure, minus lunch breaks)",
        unit: "hours",
      },
      {
        kpi: AvailableKpi.AVERAGE_HOURS_PER_USER,
        description: "Average hours worked per active user",
        unit: "hours/user",
      },
      {
        kpi: AvailableKpi.LATE_COUNT,
        description: "Number of late arrivals (after 9:05 AM)",
        unit: "count",
      },
      {
        kpi: AvailableKpi.ABSENCES,
        description: "Number of working days without arrival",
        unit: "days",
      },
      {
        kpi: AvailableKpi.LUNCH_BREAKS,
        description: "Total lunch break duration",
        unit: "hours",
      },
      {
        kpi: AvailableKpi.WORKED_DAYS,
        description: "Number of days with at least one arrival",
        unit: "days",
      },
      {
        kpi: AvailableKpi.ACTIVE_USERS,
        description: "Number of users with at least one clock entry",
        unit: "users",
      },
    ];
  }
}