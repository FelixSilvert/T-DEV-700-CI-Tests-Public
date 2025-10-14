import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsUUID, IsDateString, IsOptional } from "class-validator";
import { ClockType } from "../entities/clock.entity";

export class CreateClockDto {
  @ApiProperty({
    enum: ClockType,
    example: ClockType.ARRIVAL,
    description: "Type de pointage",
    required: true,
  })
  @IsEnum(ClockType, { message: "Type must be one of: arrival, lunchStart, lunchEnd, departure" })
  @IsNotEmpty({ message: "Type is required" })
  type: ClockType;

  @ApiProperty({
    example: "2025-10-14T08:30:00.000Z",
    description: "Date et heure du pointage (ISO 8601 format)",
    required: false,
    default: "now",
  })
  @IsOptional()
  @IsDateString({}, { message: "Timestamp must be a valid ISO 8601 date string" })
  timestamp?: string;

  @ApiProperty({
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
    description: "ID de l'utilisateur",
    required: true,
  })
  @IsUUID("4", { message: "IDUser must be a valid UUID v4" })
  @IsNotEmpty({ message: "IDUser is required" })
  IDUser: string;
}