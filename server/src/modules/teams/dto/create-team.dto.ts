import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateTeamDto {
  @ApiProperty({ example: "Trinity", required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Trinity project", required: true })
  @IsString()
  description: string;
}
