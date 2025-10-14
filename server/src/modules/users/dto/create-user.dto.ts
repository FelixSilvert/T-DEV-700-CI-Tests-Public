import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../entities/user.entity";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
  IsInt,
  Min,
  Max,
} from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    example: "John",
    description: "User's first name",
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "First name is required" })
  @MinLength(2, { message: "First name must be at least 2 characters" })
  @MaxLength(50, { message: "First name must not exceed 50 characters" })
  firstName: string;

  @ApiProperty({
    example: "Doe",
    description: "User's last name",
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Last name is required" })
  @MinLength(2, { message: "Last name must be at least 2 characters" })
  @MaxLength(50, { message: "Last name must not exceed 50 characters" })
  lastName: string;

  @ApiProperty({
    example: "john.doe@email.com",
    description: "User's email address",
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @ApiProperty({
    example: "+33600000000",
    description: "User's phone number (international format)",
  })
  @IsString()
  @IsNotEmpty({ message: "Phone number is required" })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Phone number must be in valid international format",
  })
  phoneNumber: string;

  @ApiProperty({
    example: "StrongP@ssw0rd",
    description: "Strong password (min 8 chars, uppercase, lowercase, number, special char)",
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
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
    }
  )
  @IsNotEmpty({ message: "Password is required" })
  password: string;

  @ApiProperty({
    example: "f9128a9a-8b0c-4b1d-8f44-8c7b9a7f1b22",
    description: "Team ID (optional)",
    required: false,
  })
  @IsOptional()
  @IsUUID("4", { message: "IDTeam must be a valid UUID" })
  IDTeam?: string | null;

  @ApiProperty({
    example: UserRole.USER,
    enum: UserRole,
    description: "User role (can only be set by ADMIN)",
    required: false,
    default: UserRole.USER,
  })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: "09:00",
    description: "Expected arrival time in HH:mm format",
    required: false,
    default: "09:00",
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Expected arrival time must be in HH:mm format (e.g., 09:00)",
  })
  expectedArrivalTime?: string;

  @ApiProperty({
    example: "17:00",
    description: "Expected departure time in HH:mm format",
    required: false,
    default: "17:00",
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Expected departure time must be in HH:mm format (e.g., 17:00)",
  })
  expectedDepartureTime?: string;

  @ApiProperty({
    example: 60,
    description: "Lunch break duration in minutes (15-180)",
    required: false,
    default: 60,
    minimum: 15,
    maximum: 180,
  })
  @IsOptional()
  @IsInt({ message: "Lunch break duration must be an integer" })
  @Min(15, { message: "Lunch break duration must be at least 15 minutes" })
  @Max(180, { message: "Lunch break duration must not exceed 180 minutes (3 hours)" })
  lunchBreakDuration?: number;
}