import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "../../users/entities/user.entity";

/**
 * Types de pointages possibles
 * - arrival: Arrivée au travail
 * - lunchStart: Début de pause déjeuner
 * - lunchEnd: Fin de pause déjeuner
 * - departure: Départ du travail
 */
export enum ClockType {
  ARRIVAL = "arrival",
  LUNCH_START = "lunchStart",
  LUNCH_END = "lunchEnd",
  DEPARTURE = "departure",
}

@Entity("clocks")
export class Clock {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ClockType,
    comment: "Type de pointage (arrival, lunchStart, lunchEnd, departure)",
  })
  type: ClockType;

  @Column({
    type: "timestamp",
    comment: "Date et heure du pointage",
  })
  timestamp: Date;

  @Column({
    name: "IDUser",
    type: "uuid",
    comment: "ID de l'utilisateur ayant effectué le pointage",
  })
  IDUser: string;

  @ManyToOne(() => User, (user) => user.clocks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "IDUser" })
  user: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}