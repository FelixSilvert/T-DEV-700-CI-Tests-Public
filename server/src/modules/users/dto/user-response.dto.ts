import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose } from "class-transformer";
import { UserRole } from "../entities/user.entity";

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618" })
  id: string;

  @Expose()
  @ApiProperty({ example: "John" })
  firstName: string;

  @Expose()
  @ApiProperty({ example: "Doe" })
  lastName: string;

  @Expose()
  @ApiProperty({ example: "john.doe@email.com" })
  email: string;

  @Expose()
  @ApiProperty({ example: "+33600000000" })
  phoneNumber: string;

  @Expose()
  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @Expose()
  @ApiProperty({ example: "f9128a9a-8b0c-4b1d-8f44-8c7b9a7f1b22", nullable: true })
  IDTeam: string | null;

  @Expose()
  @ApiProperty({ example: "09:00" })
  expectedArrivalTime: string;

  @Expose()
  @ApiProperty({ example: "17:00" })
  expectedDepartureTime: string;

  @Expose()
  @ApiProperty({ example: 60 })
  lunchBreakDuration: number;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;

  @Expose()
  @ApiProperty({ example: "John Doe" })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}