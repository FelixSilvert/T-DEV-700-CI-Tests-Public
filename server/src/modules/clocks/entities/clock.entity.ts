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

  @ManyToOne(() => User, (user) => user.clocks)
  @JoinColumn({ name: "IDUser" })
  user: User;
}
