import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsDateString, IsArray, IsOptional, IsUUID } from "class-validator";

export enum ReportScope {
  USER = "user",
  TEAM = "team",
  GLOBAL = "global",
}

export enum AvailableKpi {
  HOURS_WORKED = "hoursWorked",
  AVERAGE_HOURS_PER_USER = "averageHoursPerUser",
  LATE_COUNT = "lateCount",
  ABSENCES = "absences",
  LUNCH_BREAKS = "lunchBreaks",
  WORKED_DAYS = "workedDays",
  ACTIVE_USERS = "activeUsers",
}

export class GenerateReportDto {
  @ApiProperty({
    description: "Start date (ISO 8601 format)",
    example: "2025-01-01T00:00:00.000Z",
    required: true,
  })
  @IsDateString({}, { message: "from must be a valid ISO 8601 date string" })
  @IsNotEmpty({ message: "from is required" })
  from: string;

  @ApiProperty({
    description: "End date (ISO 8601 format)",
    example: "2025-01-31T23:59:59.999Z",
    required: true,
  })
  @IsDateString({}, { message: "to must be a valid ISO 8601 date string" })
  @IsNotEmpty({ message: "to is required" })
  to: string;

  @ApiProperty({
    description: "List of KPIs to compute",
    example: ["hoursWorked", "lateCount", "absences"],
    enum: AvailableKpi,
    isArray: true,
    required: true,
  })
  @IsArray({ message: "kpis must be an array" })
  @IsEnum(AvailableKpi, { each: true, message: "Invalid KPI provided" })
  @IsNotEmpty({ message: "kpis is required" })
  kpis: AvailableKpi[];

  @ApiProperty({
    description: "Scope of the report",
    enum: ReportScope,
    example: ReportScope.GLOBAL,
    required: false,
    default: ReportScope.GLOBAL,
  })
  @IsOptional()
  @IsEnum(ReportScope, { message: "scope must be user, team, or global" })
  scope?: ReportScope;

  @ApiProperty({
    description: "User ID (required if scope=user)",
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
    required: false,
  })
  @IsOptional()
  @IsUUID("4", { message: "userId must be a valid UUID" })
  userId?: string;

  @ApiProperty({
    description: "Team ID (required if scope=team)",
    example: "f9128a9a-8b0c-4b1d-8f44-8c7b9a7f1b22",
    required: false,
  })
  @IsOptional()
  @IsUUID("4", { message: "teamId must be a valid UUID" })
  teamId?: string;
}