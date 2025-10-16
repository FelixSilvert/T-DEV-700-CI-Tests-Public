import { Clock, ClockType } from "../../clocks/entities/clock.entity";
import {
  buildUtcDate,
  clampMinutes,
  parseTimeOrFallback,
  randomInt,
} from "../utils/time.utils";

export interface ClockProfile {
  id: string;
  expectedArrivalTime?: string | null;
  expectedDepartureTime?: string | null;
  lunchBreakDuration?: number | null;
}

interface Schedule {
  arrivalMinutes: number;
  departureMinutes: number;
  lunchMinutes: number;
}

type ClockSeed = Pick<Clock, "IDUser" | "type" | "timestamp">;

export class ClockFactory {
  constructor(
    private readonly defaults = {
      arrival: "09:00",
      departure: "17:00",
      lunch: 60,
    },
  ) {}

  generate(profile: ClockProfile, workdays: Date[]): ClockSeed[] {
    const daysForUser = this.pickWorkdays(workdays);
    const schedule = this.resolveSchedule(profile);
  const clocks: ClockSeed[] = [];

    for (const day of daysForUser) {
      if (randomInt(1, 100) <= 10) {
        continue;
      }

      const dailyClocks = this.buildDailyClocks(profile.id, day, schedule);
      clocks.push(...dailyClocks);
    }

    return clocks;
  }

  private resolveSchedule(profile: ClockProfile): Schedule {
    return {
      arrivalMinutes: parseTimeOrFallback(profile.expectedArrivalTime, this.defaults.arrival),
      departureMinutes: parseTimeOrFallback(profile.expectedDepartureTime, this.defaults.departure),
      lunchMinutes: profile.lunchBreakDuration ?? this.defaults.lunch,
    };
  }

  private pickWorkdays(workdays: Date[]): Date[] {
    if (workdays.length <= 1) {
      return [...workdays];
    }

    const minDays = Math.min(12, workdays.length);
    const target = randomInt(minDays, workdays.length);
    const offset = workdays.length - target;
    return workdays.slice(offset);
  }

  private buildDailyClocks(userId: string, day: Date, schedule: Schedule): ClockSeed[] {
    const earliestArrival = Math.max(schedule.arrivalMinutes - 25, 6 * 60);
    const latestArrival = Math.min(schedule.departureMinutes - 240, schedule.arrivalMinutes + 45);
    const arrivalMinutes = clampMinutes(
      schedule.arrivalMinutes + randomInt(-10, 25),
      earliestArrival,
      latestArrival,
    );

    const lunchDuration = clampMinutes(schedule.lunchMinutes + randomInt(-15, 20), 30, 120);
    const baseLunchStart = schedule.arrivalMinutes + 3.5 * 60;
    const earliestLunchStart = arrivalMinutes + 150;
    const latestLunchCandidate = schedule.departureMinutes - (lunchDuration + 150);
    const latestLunchStart = Math.max(earliestLunchStart, latestLunchCandidate);
    const lunchStartMinutes = clampMinutes(
      baseLunchStart + randomInt(-10, 15),
      earliestLunchStart,
      latestLunchStart,
    );
    const lunchEndMinutes = lunchStartMinutes + lunchDuration;

    const earliestDeparture = Math.max(lunchEndMinutes + 150, arrivalMinutes + 420);
    const latestDeparture = Math.min(schedule.departureMinutes + 75, 23 * 60 + 30);
    const departureMinutes = clampMinutes(
      schedule.departureMinutes + randomInt(-20, 45),
      earliestDeparture,
      latestDeparture,
    );

    return [
      {
        IDUser: userId,
        type: ClockType.ARRIVAL,
        timestamp: buildUtcDate(day, arrivalMinutes),
      },
      {
        IDUser: userId,
        type: ClockType.LUNCH_START,
        timestamp: buildUtcDate(day, lunchStartMinutes),
      },
      {
        IDUser: userId,
        type: ClockType.LUNCH_END,
        timestamp: buildUtcDate(day, lunchEndMinutes),
      },
      {
        IDUser: userId,
        type: ClockType.DEPARTURE,
        timestamp: buildUtcDate(day, departureMinutes),
      },
    ];
  }
}
