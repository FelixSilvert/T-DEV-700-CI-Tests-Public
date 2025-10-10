import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
import { IsNotEmpty } from "class-validator";

export class CreateClockDto {
  @ApiProperty({ example: "2025-10-09T17:47:22.123Z", required: true })
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
    required: true,
  })
  @IsUUID()
  IDUser: string;
}
