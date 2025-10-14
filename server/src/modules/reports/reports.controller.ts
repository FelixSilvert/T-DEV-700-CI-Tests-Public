import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { ReportsService } from "./reports.service";
import { GenerateReportDto, ReportScope, AvailableKpi } from "./dto/generate-report.dto";
import { ReportResponse } from "./interface/reports.interface";

@ApiTags("Reports")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: "Generate KPI report",
    description:
      "Generate a comprehensive report with selected KPIs for a specific date range and scope. " +
      "Supports user-level, team-level, or global reports. " +
      "Available KPIs: hoursWorked, averageHoursPerUser, lateCount, absences, lunchBreaks, workedDays, activeUsers",
  })
  @ApiQuery({
    name: "from",
    required: true,
    type: String,
    description: "Start date (ISO 8601 format)",
    example: "2025-01-01T00:00:00.000Z",
  })
  @ApiQuery({
    name: "to",
    required: true,
    type: String,
    description: "End date (ISO 8601 format)",
    example: "2025-01-31T23:59:59.999Z",
  })
  @ApiQuery({
    name: "kpis",
    required: true,
    type: String,
    description:
      "Comma-separated list of KPIs: hoursWorked, averageHoursPerUser, lateCount, absences, lunchBreaks, workedDays, activeUsers",
    example: "hoursWorked,lateCount,absences",
  })
  @ApiQuery({
    name: "scope",
    required: false,
    enum: ReportScope,
    description: "Report scope (default: global)",
    example: ReportScope.GLOBAL,
  })
  @ApiQuery({
    name: "userId",
    required: false,
    type: String,
    description: "User ID (required if scope=user)",
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @ApiQuery({
    name: "teamId",
    required: false,
    type: String,
    description: "Team ID (required if scope=team)",
    example: "f9128a9a-8b0c-4b1d-8f44-8c7b9a7f1b22",
  })
  @ApiResponse({
    status: 200,
    description: "Report generated successfully",
    schema: {
      example: {
        scope: "team",
        from: "2025-01-01T00:00:00.000Z",
        to: "2025-01-31T23:59:59.999Z",
        targetId: "f9128a9a-8b0c-4b1d-8f44-8c7b9a7f1b22",
        targetName: "Engineering Team",
        periodInfo: {
          totalDays: 31,
          workingDays: 23,
        },
        kpis: {
          hoursWorked: {
            value: 920.5,
            unit: "hours",
            details: {
              "user-1": 184.5,
              "user-2": 176.0,
              "user-3": 180.0,
              "user-4": 190.0,
              "user-5": 190.0,
            },
          },
          lateCount: {
            value: 8,
            unit: "count",
            details: {
              "user-1": { count: 2, dates: ["2025-01-05", "2025-01-12"] },
              "user-3": { count: 3, dates: ["2025-01-08", "2025-01-15", "2025-01-22"] },
              "user-5": { count: 3, dates: ["2025-01-10", "2025-01-17", "2025-01-24"] },
            },
          },
          absences: {
            value: 5,
            unit: "days",
            details: {
              "user-2": { count: 2, dates: ["2025-01-10", "2025-01-11"] },
              "user-4": { count: 3, dates: ["2025-01-20", "2025-01-21", "2025-01-22"] },
            },
          },
        },
        generatedAt: "2025-10-14T10:57:20.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid parameters" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Resource not found (user/team)" })
  async generateReport(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("kpis") kpis: string,
    @Query("scope") scope: ReportScope = ReportScope.GLOBAL,
    @Query("userId") userId?: string,
    @Query("teamId") teamId?: string,
  ): Promise<ReportResponse> { // ✅ Type de retour explicite
    // Valider et parser les paramètres
    if (!from || !to || !kpis) {
      throw new BadRequestException("Missing required parameters: from, to, kpis");
    }

    // Parser les KPIs
    const kpiList = kpis
      .split(",")
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (kpiList.length === 0) {
      throw new BadRequestException("At least one KPI must be provided");
    }

    // Valider les KPIs
    const validKpis = Object.values(AvailableKpi);
    const invalidKpis = kpiList.filter(kpi => !validKpis.includes(kpi as AvailableKpi));

    if (invalidKpis.length > 0) {
      throw new BadRequestException(
        `Invalid KPIs: ${invalidKpis.join(", ")}. Valid KPIs: ${validKpis.join(", ")}`
      );
    }

    // Construire le DTO
    const dto: GenerateReportDto = {
      from,
      to,
      kpis: kpiList as AvailableKpi[],
      scope,
      userId,
      teamId,
    };

    return this.reportsService.generateReport(dto);
  }

  @Get("available-kpis")
  @ApiOperation({
    summary: "List available KPIs",
    description: "Returns a list of all available KPIs with their descriptions and units",
  })
  @ApiResponse({
    status: 200,
    description: "List of available KPIs",
    schema: {
      example: [
        {
          kpi: "hoursWorked",
          description: "Total hours worked (arrival to departure, minus lunch breaks)",
          unit: "hours",
        },
        {
          kpi: "averageHoursPerUser",
          description: "Average hours worked per active user",
          unit: "hours/user",
        },
        {
          kpi: "lateCount",
          description: "Number of late arrivals (after 9:05 AM)",
          unit: "count",
        },
      ],
    },
  })
  getAvailableKpis() {
    return this.reportsService.getAvailableKpis();
  }
}