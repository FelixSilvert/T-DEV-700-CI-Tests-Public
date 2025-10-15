// src/modules/reports/services/kpi-calculator.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Clock, ClockType } from "../../clocks/entities/clock.entity";
import { User } from "../../users/entities/user.entity";
import { KpiResult } from "../interface/reports.interface";

interface ExpectedSchedule {
  expectedArrivalMinutes: number;
  expectedDepartureMinutes: number;
  expectedLunchMinutes: number;
}

@Injectable()
export class KpiCalculatorService {
  private readonly logger = new Logger(KpiCalculatorService.name);

  /**
   * 1. Heures travaillées totales
   */
  calculateHoursWorked(users: User[], from: Date, to: Date): KpiResult {
    let totalMinutes = 0;
    const userDetails: Record<string, number> = {};

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      const clocksByDay = this.groupClocksByDay(clocks);

      let userMinutes = 0;
      for (const [, dayClocks] of Object.entries(clocksByDay)) {
        userMinutes += this.calculateDayMinutes(dayClocks);
      }

      if (userMinutes > 0) {
        const hours = Math.round((userMinutes / 60) * 100) / 100;
        userDetails[user.id] = hours;
        totalMinutes += userMinutes;
      }
    }

    return {
      value: Math.round((totalMinutes / 60) * 100) / 100,
      unit: "hours",
      details: userDetails,
    };
  }

  /**
   * 2. Heures de retard (écarts cumulés par rapport aux horaires attendus)
   */
  calculateLateHours(users: User[], from: Date, to: Date): KpiResult {
    let totalLateMinutes = 0;
    const userDetails: Record<string, number> = {};

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      const clocksByDay = this.groupClocksByDay(clocks);
      const expectedSchedule = this.getExpectedSchedule(user);

      let userLateMinutes = 0;
      for (const [, dayClocks] of Object.entries(clocksByDay)) {
        userLateMinutes += this.calculateDayLateMinutes(dayClocks, expectedSchedule);
      }

      if (userLateMinutes > 0) {
        const hours = Math.round((userLateMinutes / 60) * 100) / 100;
        userDetails[user.id] = hours;
        totalLateMinutes += userLateMinutes;
      }
    }

    return {
      value: Math.round((totalLateMinutes / 60) * 100) / 100,
      unit: "hours",
      details: userDetails,
    };
  }

  /**
   * 3. Moyenne d'heures par jour travaillé
   */
  calculateAverageHoursPerDay(users: User[], from: Date, to: Date): KpiResult {
    const hoursWorked = this.calculateHoursWorked(users, from, to);
    const workedDays = this.calculateWorkedDays(users, from, to);

    const average = workedDays.value > 0 ? hoursWorked.value / workedDays.value : 0;

    return {
      value: Math.round(average * 100) / 100,
      unit: "hours",
      details: {
        totalHours: hoursWorked.value,
        totalDays: workedDays.value,
      },
    };
  }

  /**
   * 4. Nombre de jours travaillés
   */
  calculateWorkedDays(users: User[], from: Date, to: Date): KpiResult {
    let totalDays = 0;
    const userDetails: Record<string, number> = {};

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      const arrivalDates = new Set(
        clocks
          .filter(c => c.type === ClockType.ARRIVAL)
          .map(c => this.formatDate(c.timestamp))
      );

      const days = arrivalDates.size;
      if (days > 0) {
        userDetails[user.id] = days;
        totalDays += days;
      }
    }

    return {
      value: totalDays,
      unit: "days",
      details: userDetails,
    };
  }

  /**
   * 5. Jours d'absence (jours ouvrés sans arrival)
   */
  calculateAbsences(users: User[], from: Date, to: Date): KpiResult {
    const workingDays = this.getWorkingDays(from, to);
    let totalAbsences = 0;
    const userDetails: Record<string, number> = {};

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      const arrivalDates = new Set(
        clocks
          .filter(c => c.type === ClockType.ARRIVAL)
          .map(c => this.formatDate(c.timestamp))
      );

      const absences = workingDays.filter(day => !arrivalDates.has(this.formatDate(day))).length;

      if (absences > 0) {
        userDetails[user.id] = absences;
        totalAbsences += absences;
      }
    }

    return {
      value: totalAbsences,
      unit: "days",
      details: userDetails,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Calcule les minutes travaillées pour une journée
   */
  private calculateDayMinutes(clocks: Clock[]): number {
    const arrival = clocks.find(c => c.type === ClockType.ARRIVAL);
    const departure = clocks.find(c => c.type === ClockType.DEPARTURE);

    if (!arrival || !departure) return 0;

    let minutes = (departure.timestamp.getTime() - arrival.timestamp.getTime()) / 1000 / 60;

    // Soustraire la pause déjeuner
    const lunchStart = clocks.find(c => c.type === ClockType.LUNCH_START);
    const lunchEnd = clocks.find(c => c.type === ClockType.LUNCH_END);

    if (lunchStart && lunchEnd) {
      const lunchMinutes = (lunchEnd.timestamp.getTime() - lunchStart.timestamp.getTime()) / 1000 / 60;
      minutes -= lunchMinutes;
    }

    return Math.max(0, minutes);
  }

  /**
   * Calcule les minutes de retard
   */
  // Mesure le retard quotidien en se basant sur l'arrivée, le départ et la pause déjeuner attendus
  private calculateDayLateMinutes(dayClocks: Clock[], schedule: ExpectedSchedule): number {
    const arrivalClock = dayClocks.find(clock => clock.type === ClockType.ARRIVAL);
    if (!arrivalClock) {
      return 0;
    }

    let lateMinutes = Math.max(
      0,
      this.getMinutesFromTimestamp(arrivalClock.timestamp) - schedule.expectedArrivalMinutes,
    );

    const departureClock = dayClocks.find(clock => clock.type === ClockType.DEPARTURE);
    if (departureClock) {
      lateMinutes += Math.max(
        0,
        schedule.expectedDepartureMinutes - this.getMinutesFromTimestamp(departureClock.timestamp),
      );
    }

    const lunchDuration = this.getLunchDuration(dayClocks);
    if (lunchDuration !== null && lunchDuration > schedule.expectedLunchMinutes) {
      lateMinutes += lunchDuration - schedule.expectedLunchMinutes;
    }

    return lateMinutes;
  }

  private getExpectedSchedule(user: User): ExpectedSchedule {
    const expectedArrivalMinutes = this.timeStringToMinutes(user.expectedArrivalTime, 9 * 60);
    const expectedDepartureMinutes = this.timeStringToMinutes(user.expectedDepartureTime, 17 * 60);
    const expectedLunchMinutes = user.lunchBreakDuration ?? 60;

    return {
      expectedArrivalMinutes,
      expectedDepartureMinutes: Math.max(expectedArrivalMinutes, expectedDepartureMinutes),
      expectedLunchMinutes,
    };
  }

  private timeStringToMinutes(value?: string | null, fallbackMinutes = 0): number {
    if (!value) {
      return fallbackMinutes;
    }

    const parts = value.split(":").map(Number).filter(part => !Number.isNaN(part));
    if (parts.length < 2) {
      return fallbackMinutes;
    }

    return parts[0] * 60 + parts[1];
  }

  private getMinutesFromTimestamp(date: Date): number {
    const ts = new Date(date);
    return ts.getUTCHours() * 60 + ts.getUTCMinutes();
  }

  private getLunchDuration(dayClocks: Clock[]): number | null {
    const lunchStart = dayClocks.find(clock => clock.type === ClockType.LUNCH_START);
    const lunchEnd = dayClocks.find(clock => clock.type === ClockType.LUNCH_END);

    if (!lunchStart || !lunchEnd) {
      return null;
    }

    const duration = (lunchEnd.timestamp.getTime() - lunchStart.timestamp.getTime()) / 60000;
    return Math.max(0, duration);
  }

  /**
   * Filtre les clocks par période
   */
  private filterClocksByDate(clocks: Clock[] | undefined, from: Date, to: Date): Clock[] {
    if (!clocks) return [];

    const fromTime = from.getTime();
    const toTime = to.getTime();

    return clocks.filter(clock => {
      const time = new Date(clock.timestamp).getTime();
      return time >= fromTime && time <= toTime;
    });
  }

  /**
   * Groupe les clocks par jour
   */
  private groupClocksByDay(clocks: Clock[]): Record<string, Clock[]> {
    return clocks.reduce((acc, clock) => {
      const date = this.formatDate(clock.timestamp);
      if (!acc[date]) acc[date] = [];
      acc[date].push(clock);
      return acc;
    }, {} as Record<string, Clock[]>);
  }

  /**
   * Retourne les jours ouvrés (lundi-vendredi)
   */
  private getWorkingDays(from: Date, to: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Formate une date en YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
}