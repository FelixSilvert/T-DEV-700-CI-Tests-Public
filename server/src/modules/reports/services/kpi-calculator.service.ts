import { Injectable, Logger } from "@nestjs/common";
import { Clock, ClockType } from "../../clocks/entities/clock.entity";
import { User } from "../../users/entities/user.entity";

export interface KpiResult {
  value: number;
  unit: string;
  details?: Record<string, any>;
}

@Injectable()
export class KpiCalculatorService {
  private readonly logger = new Logger(KpiCalculatorService.name);

  /**
   * Calcule les heures travaillées réelles en matchant arrival/departure
   * et en soustrayant les pauses déjeuner (lunchStart/lunchEnd)
   */
  calculateHoursWorked(users: User[], from: Date, to: Date): KpiResult {
    let totalMinutes = 0;
    const userDetails: Record<string, number> = {};

    this.logger.debug(`Calculating hours worked from ${from.toISOString()} to ${to.toISOString()}`);

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      
      this.logger.debug(`User ${user.id} has ${clocks.length} clocks in period`);
      
      const clocksByDay = this.groupClocksByDay(clocks);

      let userMinutes = 0;

      for (const [date, dayClocks] of Object.entries(clocksByDay)) {
        this.logger.debug(`Processing ${date}: ${dayClocks.length} clocks`);
        const dayMinutes = this.calculateDayWorkedMinutes(dayClocks, date);
        this.logger.debug(`Day ${date}: ${dayMinutes} minutes worked`);
        userMinutes += dayMinutes;
      }

      const userHours = Math.round((userMinutes / 60) * 100) / 100;
      if (userHours > 0) {
        userDetails[user.id] = userHours;
      }
      totalMinutes += userMinutes;
    }

    return {
      value: Math.round((totalMinutes / 60) * 100) / 100,
      unit: "hours",
      details: userDetails,
    };
  }

  /**
   * Calcule les minutes travaillées pour une journée
   * Formule: (departure - arrival) - (lunchEnd - lunchStart)
   */
  private calculateDayWorkedMinutes(dayClocks: Clock[], date: string): number {
    const arrival = dayClocks.find(c => c.type === ClockType.ARRIVAL);
    const lunchStart = dayClocks.find(c => c.type === ClockType.LUNCH_START);
    const lunchEnd = dayClocks.find(c => c.type === ClockType.LUNCH_END);
    const departure = dayClocks.find(c => c.type === ClockType.DEPARTURE);

    this.logger.debug(`Day ${date} - Arrival: ${arrival ? 'YES' : 'NO'}, Departure: ${departure ? 'YES' : 'NO'}`);

    // Si pas d'arrival ou de departure, journée incomplète
    if (!arrival || !departure) {
      this.logger.warn(`Incomplete day ${date}: missing ${!arrival ? 'arrival' : 'departure'}`);
      return 0;
    }

    // Temps total entre arrivée et départ en minutes
    const totalMinutes = (departure.timestamp.getTime() - arrival.timestamp.getTime()) / 1000 / 60;
    
    this.logger.debug(`Total time between arrival and departure: ${totalMinutes} minutes`);

    // Soustraire la pause déjeuner si complète
    let lunchMinutes = 0;
    if (lunchStart && lunchEnd) {
      lunchMinutes = (lunchEnd.timestamp.getTime() - lunchStart.timestamp.getTime()) / 1000 / 60;
      this.logger.debug(`Lunch break: ${lunchMinutes} minutes`);
    }

    const workedMinutes = Math.max(0, totalMinutes - lunchMinutes);
    this.logger.debug(`Worked minutes (after lunch deduction): ${workedMinutes}`);

    return workedMinutes;
  }

  /**
   * Calcule le nombre de retards (arrival après 9h05)
   */
  calculateLateCount(users: User[], from: Date, to: Date): KpiResult {
    const LATE_THRESHOLD_HOUR = 9;
    const LATE_THRESHOLD_MINUTE = 5;

    let totalLate = 0;
    const userDetails: Record<string, { count: number; dates: string[] }> = {};

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      const arrivals = clocks.filter(c => c.type === ClockType.ARRIVAL);

      const lateDates: string[] = [];

      for (const arrival of arrivals) {
        const hour = arrival.timestamp.getHours();
        const minute = arrival.timestamp.getMinutes();

        const isLate =
          hour > LATE_THRESHOLD_HOUR ||
          (hour === LATE_THRESHOLD_HOUR && minute > LATE_THRESHOLD_MINUTE);

        if (isLate) {
          lateDates.push(this.formatDate(arrival.timestamp));
          totalLate++;
        }
      }

      if (lateDates.length > 0) {
        userDetails[user.id] = {
          count: lateDates.length,
          dates: lateDates,
        };
      }
    }

    return {
      value: totalLate,
      unit: "count",
      details: userDetails,
    };
  }

  /**
   * Calcule les jours d'absence (jours ouvrés sans arrival)
   */
  calculateAbsences(users: User[], from: Date, to: Date): KpiResult {
    const workingDays = this.getWorkingDaysBetween(from, to);
    let totalAbsences = 0;
    const userDetails: Record<string, { count: number; dates: string[] }> = {};

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      const arrivalDates = new Set(
        clocks
          .filter(c => c.type === ClockType.ARRIVAL)
          .map(c => this.formatDate(c.timestamp))
      );

      const absentDates = workingDays
        .filter(day => !arrivalDates.has(this.formatDate(day)))
        .map(day => this.formatDate(day));

      if (absentDates.length > 0) {
        userDetails[user.id] = {
          count: absentDates.length,
          dates: absentDates,
        };
        totalAbsences += absentDates.length;
      }
    }

    return {
      value: totalAbsences,
      unit: "days",
      details: userDetails,
    };
  }

  /**
   * Calcule la moyenne d'heures travaillées par utilisateur
   */
  calculateAverageHoursPerUser(users: User[], from: Date, to: Date): KpiResult {
    const hoursWorked = this.calculateHoursWorked(users, from, to);
    const activeUsers = Object.keys(hoursWorked.details || {}).length;
    const average = activeUsers > 0 ? hoursWorked.value / activeUsers : 0;

    return {
      value: Math.round(average * 100) / 100,
      unit: "hours/user",
      details: {
        totalHours: hoursWorked.value,
        activeUsers,
      },
    };
  }

  /**
   * Calcule le total de pauses déjeuner prises
   */
  calculateLunchBreaks(users: User[], from: Date, to: Date): KpiResult {
    let totalLunchMinutes = 0;
    const userDetails: Record<string, number> = {};

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      const clocksByDay = this.groupClocksByDay(clocks);

      let userLunchMinutes = 0;

      for (const [, dayClocks] of Object.entries(clocksByDay)) {
        const lunchStart = dayClocks.find(c => c.type === ClockType.LUNCH_START);
        const lunchEnd = dayClocks.find(c => c.type === ClockType.LUNCH_END);

        if (lunchStart && lunchEnd) {
          const lunchMinutes =
            (lunchEnd.timestamp.getTime() - lunchStart.timestamp.getTime()) / 1000 / 60;
          userLunchMinutes += lunchMinutes;
        }
      }

      if (userLunchMinutes > 0) {
        const userLunchHours = Math.round((userLunchMinutes / 60) * 100) / 100;
        userDetails[user.id] = userLunchHours;
        totalLunchMinutes += userLunchMinutes;
      }
    }

    return {
      value: Math.round((totalLunchMinutes / 60) * 100) / 100,
      unit: "hours",
      details: userDetails,
    };
  }

  /**
   * Calcule le nombre de jours travaillés (avec arrival)
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

      const userDays = arrivalDates.size;
      if (userDays > 0) {
        userDetails[user.id] = userDays;
        totalDays += userDays;
      }
    }

    return {
      value: totalDays,
      unit: "days",
      details: userDetails,
    };
  }

  /**
   * Calcule le nombre d'utilisateurs actifs (avec au moins un clock)
   */
  calculateActiveUsers(users: User[], from: Date, to: Date): KpiResult {
    const activeUserIds: string[] = [];

    for (const user of users) {
      const clocks = this.filterClocksByDate(user.clocks, from, to);
      if (clocks.length > 0) {
        activeUserIds.push(user.id);
      }
    }

    return {
      value: activeUserIds.length,
      unit: "users",
      details: {
        userIds: activeUserIds,
      },
    };
  }

  /**
   * Filtre les clocks par période
   * ✅ FIX: Comparaison correcte des dates en ignorant les millisecondes
   */
  private filterClocksByDate(clocks: Clock[] | undefined, from: Date, to: Date): Clock[] {
    if (!clocks || clocks.length === 0) return [];

    // Normaliser les dates pour la comparaison
    const fromTime = from.getTime();
    const toTime = to.getTime();

    const filtered = clocks.filter(clock => {
      const clockTime = new Date(clock.timestamp).getTime();
      return clockTime >= fromTime && clockTime <= toTime;
    });

    this.logger.debug(`Filtered ${filtered.length} clocks out of ${clocks.length} between ${from.toISOString()} and ${to.toISOString()}`);

    return filtered;
  }

  /**
   * Groupe les clocks par jour (YYYY-MM-DD)
   */
  private groupClocksByDay(clocks: Clock[]): Record<string, Clock[]> {
    return clocks.reduce((acc, clock) => {
      const dateKey = this.formatDate(clock.timestamp);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(clock);
      return acc;
    }, {} as Record<string, Clock[]>);
  }

  /**
   * Retourne les jours ouvrés (lundi-vendredi) entre deux dates
   */
  private getWorkingDaysBetween(from: Date, to: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(from);
    current.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      // 0 = dimanche, 6 = samedi
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * Formate une date en YYYY-MM-DD pour comparaison
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}