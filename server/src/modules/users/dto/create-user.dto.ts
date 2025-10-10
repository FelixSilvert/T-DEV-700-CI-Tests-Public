import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({ example: "John", required: true })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: "Doe", required: true })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: "john.doe@email.com", required: true })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "+33 6 00 00 00 00", required: true })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: number;

  @ApiProperty({ example: "StrongPassword123", required: true })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}
