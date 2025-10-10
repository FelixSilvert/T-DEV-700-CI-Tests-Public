import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { UserRole } from "../entities/user.entity";

export class UpdateRoleDto {
  @ApiProperty({ example: "USER", required: true })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;
}
