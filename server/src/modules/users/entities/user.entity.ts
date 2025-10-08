import { Team } from "src/modules/teams/entities/team.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

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
  password: string;

  @Column({ type: "boolean" })
  isManager: boolean;

  @Column({ type: "boolean" })
  isAdmin: boolean;

  @ManyToOne(() => Team, (team) => team.members)
  @JoinColumn({ name: "IDTeam" })
  team: Team;
}
