import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class SignInDto {
  @ApiProperty({ example: "john.doe@email.com", required: true })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "StrongPassword123", required: true })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}
