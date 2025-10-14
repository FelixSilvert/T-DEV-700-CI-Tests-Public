import { Exclude } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Team } from "../../teams/entities/team.entity";
import { Clock } from "../../clocks/entities/clock.entity";

export enum UserRole {
  USER = "user",
  MANAGER = "manager",
  ADMIN = "admin",
}

@Entity("users")
export class User {
  @ApiProperty({ example: "61bbe47d-ef9f-4db4-b11c-ac49aa15a618" })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({ example: "John" })
  @Column({ type: "varchar", length: 100 })
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @Column({ type: "varchar", length: 100 })
  lastName: string;

  @ApiProperty({ example: "john.doe@email.com" })
  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @ApiProperty({ example: "+33600000000" })
  @Column({ type: "varchar", length: 20, unique: true })
  phoneNumber: string;

  @Exclude() 
  @Column({ type: "varchar" })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ example: "f9128a9a-8b0c-4b1d-8f44-8c7b9a7f1b22", nullable: true })
  @Column({ name: "IDTeam", type: "uuid", nullable: true })
  IDTeam: string | null;

  @ApiProperty({
    example: "09:00",
    description: "Expected arrival time (HH:mm format)",
    nullable: true,
  })
  @Column({ type: "time", nullable: true, default: "09:00" })
  expectedArrivalTime: string;

  @ApiProperty({
    example: "17:00",
    description: "Expected departure time (HH:mm format)",
    nullable: true,
  })
  @Column({ type: "time", nullable: true, default: "17:00" })
  expectedDepartureTime: string;

  @ApiProperty({
    example: 60,
    description: "Lunch break duration in minutes",
    nullable: true,
  })
  @Column({ type: "int", nullable: true, default: 60 })
  lunchBreakDuration: number; // En minutes

  @ManyToOne(() => Team, (team) => team.members, { nullable: true })
  @JoinColumn({ name: "IDTeam" })
  team: Team;

  @OneToMany(() => Clock, (clock) => clock.user)
  clocks: Clock[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}