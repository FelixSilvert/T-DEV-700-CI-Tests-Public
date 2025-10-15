import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsDateString, IsArray, IsOptional, IsUUID, ArrayMinSize } from "class-validator";

export enum ReportScope {
  USER = "user",
  TEAM = "team",
  GLOBAL = "global",
}

export enum AvailableKpi {
  HOURS_WORKED = "hoursWorked",              // Heures travaillées totales
  LATE_HOURS = "lateHours",                  // Heures de retard
  AVERAGE_HOURS_PER_DAY = "averageHoursPerDay", // Moyenne d'heures/jour
  WORKED_DAYS = "workedDays",                // Jours travaillés
  ABSENCES = "absences",                     // Jours d'absence
}

export class GenerateReportDto {
  @ApiProperty({
    description: "Start date (ISO 8601)",
    example: "2025-01-01T00:00:00.000Z",
  })
  @IsDateString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({
    description: "End date (ISO 8601)",
    example: "2025-01-31T23:59:59.999Z",
  })
  @IsDateString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({
    description: "List of KPIs",
    example: ["hoursWorked", "lateHours", "absences"],
    enum: AvailableKpi,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(AvailableKpi, { each: true })
  kpis: AvailableKpi[];

  @ApiProperty({
    description: "Report scope",
    enum: ReportScope,
    default: ReportScope.GLOBAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(ReportScope)
  scope?: ReportScope;

  @ApiProperty({
    description: "User ID (if scope=user)",
    required: false,
  })
  @IsOptional()
  @IsUUID("4")
  userId?: string;

  @ApiProperty({
    description: "Team ID (if scope=team)",
    required: false,
  })
  @IsOptional()
  @IsUUID("4")
  teamId?: string;
}