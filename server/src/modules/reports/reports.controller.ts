import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { ReportsService } from "./reports.service";

@ApiTags("Reports")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: "Generate KPI reports",
    description:
      "Generate a report based on selected KPIs for a specific date range and optional scope (user, team, or global). " +
      "Provide `from` and `to` dates in ISO format. You can select multiple KPIs by separating them with commas.",
  })
  @ApiQuery({
    name: "from",
    required: true,
    type: String,
    description: "Start date (ISO format, e.g. 2025-01-01T00:00:00Z)",
    example: "2025-01-01T00:00:00Z",
  })
  @ApiQuery({
    name: "to",
    required: true,
    type: String,
    description: "End date (ISO format, e.g. 2025-01-31T23:59:59Z)",
    example: "2025-01-31T23:59:59Z",
  })
  @ApiQuery({
    name: "kpis",
    required: true,
    type: String,
    description: "Comma separated list of KPIs to compute (e.g. `totalHours,totalUsers`)",
    example: "totalHours,averagePerUser",
  })
  @ApiQuery({
    name: "scope",
    required: false,
    type: String,
    enum: ["user", "team", "global"],
    description: "Scope of the report. Default: `global`",
    example: "team",
  })
  @ApiQuery({
    name: "userId",
    required: false,
    type: String,
    description: "User ID if scope = `user`",
    example: "3b2a2c5e-99d1-4a7f-8123-f4eaa9be7a11",
  })
  @ApiQuery({
    name: "teamId",
    required: false,
    type: String,
    description: "Team ID if scope = `team`",
    example: "f9128a9a-8b0c-4b1d-8f44-8c7b9a7f1b22",
  })
  @ApiResponse({
    status: 200,
    description: "Report generated successfully",
    schema: {
      example: {
        scope: "team",
        from: "2025-01-01T00:00:00Z",
        to: "2025-01-31T23:59:59Z",
        kpis: {
          totalHours: 540,
          averagePerUser: 108,
          totalUsers: 5,
        },
      },
    },
  })
  async getReport(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("kpis") kpis: string,
    @Query("scope") scope: "user" | "team" | "global" = "global",
    @Query("userId") userId?: string,
    @Query("teamId") teamId?: string,
  ) {
    const kpiList = kpis.split(",").map((k) => k.trim());
    return this.reportsService.generateReport({
      from,
      to,
      kpis: kpiList,
      scope,
      userId,
      teamId,
    });
  }
}
