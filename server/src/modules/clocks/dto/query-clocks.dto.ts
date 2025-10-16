import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsEnum, IsUUID, IsDateString } from "class-validator";
import { ClockType } from "../entities/clock.entity";
import { CursorPaginationQueryDto } from "../../../common/pagination/pagination.dto";

export class QueryClocksDto extends CursorPaginationQueryDto {
  @ApiProperty({
    required: false,
    description: "ID de l'utilisateur",
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
  })
  @IsOptional()
  @IsUUID("4")
  userId?: string;

  @ApiProperty({
    required: false,
    description: "ID de l'équipe",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  @IsOptional()
  @IsUUID("4")
  teamId?: string;

  @ApiProperty({
    required: false,
    enum: ClockType,
    description: "Type de pointage à filtrer",
    example: ClockType.ARRIVAL,
  })
  @IsOptional()
  @IsEnum(ClockType)
  type?: ClockType;

  @ApiProperty({
    required: false,
    description: "Date de début (ISO 8601)",
    example: "2025-10-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    required: false,
    description: "Date de fin (ISO 8601)",
    example: "2025-10-14T23:59:59.999Z",
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: "Nombre de clocks à charger par batch",
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  declare limit?: number;

  @ApiPropertyOptional({
    description: "Cursor de la requête précédente pour charger la suite",
    example: "MjAyNS0xMC0xNFQxMDozMDowMC4wMDBaOjo2MWJiZTQ3ZC1lZjlmLTRkYjQtYjExYy1hYzQ5YWExNWE2MTg=",
  })
  declare cursor?: string;
}