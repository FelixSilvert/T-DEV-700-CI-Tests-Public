import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateClockDto {
  @ApiProperty({ example: "2025-10-09T13:47:22.123Z", required: true })
  @IsNotEmpty()
  date: Date;
}
