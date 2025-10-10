import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
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

  @ApiProperty({
    example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618",
    required: true,
  })
  @IsUUID()
  IDTeam: string;
}
