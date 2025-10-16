import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, TransformFnParams } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from "class-validator";

const toInt = ({ value }: TransformFnParams): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : parseInt(String(value), 10);

  return Number.isNaN(parsed) ? undefined : parsed;
};

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: "Numéro de page à récupérer", minimum: 1, default: 1 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Nombre d'éléments par page", minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CursorPaginationQueryDto {
  @ApiPropertyOptional({ description: "Nombre d'éléments à récupérer", minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: "Cursor de pagination retourné par la requête précédente" })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class SearchPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Texte libre pour filtrer les résultats", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
