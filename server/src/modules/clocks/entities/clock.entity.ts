import { User } from "src/modules/users/entities/user.entity";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("clocks")
export class Clock {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "timestamp" })
  date: Date;

  @Column({ name: "IDUser", type: "uuid", nullable: true })
  IDUser: string;

  @ManyToOne(() => User, (user) => user.clocks)
  @JoinColumn({ name: "IDUser" })
  user: User;
}
