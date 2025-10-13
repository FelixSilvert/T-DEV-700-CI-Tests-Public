import { Exclude } from "class-transformer";
import { Team } from "../../teams/entities/team.entity";
import { Clock } from "../../clocks/entities/clock.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum UserRole {
  USER = "user",
  MANAGER = "manager",
  ADMIN = "admin",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  firstName: string;

  @Column({ type: "varchar" })
  lastName: string;

  @Column({ type: "varchar" })
  email: string;

  @Column({ type: "varchar" })
  phoneNumber: number;

  @Column({ type: "varchar" })
  @Exclude()
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: "IDTeam", type: "uuid", nullable: true })
  IDTeam: string | null;

  @ManyToOne(() => Team, (team) => team.members)
  @JoinColumn({ name: "IDTeam" })
  team: Team;

  @OneToMany(() => Clock, (clock) => clock.user)
  clocks: Clock[];
}
