import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdateRoleDto {
  @ApiProperty({ example: "true", required: true })
  @IsBoolean()
  @IsNotEmpty()
  isManager: boolean;
}
