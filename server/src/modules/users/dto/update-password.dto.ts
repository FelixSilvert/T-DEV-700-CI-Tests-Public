import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsStrongPassword } from "class-validator";

export class UpdatePasswordDto {
  @ApiProperty({
    example: "OldP@ssw0rd",
    description: "Current password",
  })
  @IsNotEmpty({ message: "Current password is required" })
  currentPassword: string;

  @ApiProperty({
    example: "NewStrongP@ssw0rd",
    description: "New strong password",
    minLength: 8,
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        "New password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
    }
  )
  @IsNotEmpty({ message: "New password is required" })
  newPassword: string;
}