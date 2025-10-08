import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateTeamDto {
  @ApiProperty({ example: "Trinity", required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Trinity project", required: false })
  @IsString()
  description: string;

  @ApiProperty({
    example: "998c0961-cb69-43d8-8d8b-0eaf6a2e9412",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  managerId: string;
}
