import { Controller, Get, Query, UseGuards, BadRequestException, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { GenerateReportDto, ReportScope, AvailableKpi } from "./dto/generate-report.dto";
import { ReportResponse } from "./interface/reports.interface";
import { ReportsService } from "./reports.service";

@ApiTags("Reports")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate report with KPIs" })
  @ApiQuery({ name: "from", required: true, example: "2025-01-01T00:00:00.000Z" })
  @ApiQuery({ name: "to", required: true, example: "2025-01-31T23:59:59.999Z" })
  @ApiQuery({ name: "kpis", required: true, example: "hoursWorked,lateHours,absences" })
  @ApiQuery({ name: "scope", required: false, enum: ReportScope, example: "global" })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "teamId", required: false })
  @ApiResponse({ status: 200, description: "Report generated" })
  async generateReport(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("kpis") kpis: string,
    @Query("scope") scope: ReportScope = ReportScope.GLOBAL,
    @Query("userId") userId?: string,
    @Query("teamId") teamId?: string,
  ): Promise<ReportResponse> {
    if (!from || !to || !kpis) {
      throw new BadRequestException("Missing required parameters: from, to, kpis");
    }

    const kpiList = kpis.split(",").map(k => k.trim());
    const validKpis = Object.values(AvailableKpi);
    const invalidKpis = kpiList.filter(k => !validKpis.includes(k as AvailableKpi));

    if (invalidKpis.length > 0) {
      throw new BadRequestException(`Invalid KPIs: ${invalidKpis.join(", ")}`);
    }

    const dto: GenerateReportDto = { from, to, kpis: kpiList as AvailableKpi[], scope, userId, teamId };
    return this.reportsService.generateReport(dto);
  }

  @Get("available-kpis")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List available KPIs" })
  @ApiResponse({ status: 200, description: "List of KPIs" })
  getAvailableKpis() {
    return this.reportsService.getAvailableKpis();
  }
}