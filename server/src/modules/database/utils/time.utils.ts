const MS_PER_MINUTE = 60_000;

export function parseTimeOrFallback(value: string | null | undefined, fallback: string): number {
  const source = value ?? fallback;
  const [hoursStr, minutesStr] = source.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    const [fallbackHours, fallbackMinutes] = fallback.split(":").map(Number);
    return fallbackHours * 60 + fallbackMinutes;
  }

  return hours * 60 + minutes;
}

export function clampMinutes(value: number, min: number, max: number): number {
  const roundedMin = Math.round(min);
  const roundedMax = Math.round(max);
  const roundedValue = Math.round(value);

  if (roundedMin > roundedMax) {
    return roundedMin;
  }

  return Math.min(Math.max(roundedValue, roundedMin), roundedMax);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function buildUtcDate(day: Date, minutesFromMidnight: number): Date {
  return new Date(startOfUtcDay(day).getTime() + minutesFromMidnight * MS_PER_MINUTE);
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

export function addUtcDays(date: Date, amount: number): Date {
  return new Date(startOfUtcDay(date).getTime() + amount * 86_400_000);
}

function isWeekday(date: Date): boolean {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

interface GenerateWorkdaysOptions {
  includeToday?: boolean;
  referenceDate?: Date;
}

export function generateRecentWorkdays(
  count: number,
  options: GenerateWorkdaysOptions = {},
): Date[] {
  const { includeToday = false, referenceDate = new Date() } = options;

  const workdays: Date[] = [];
  let cursor = includeToday ? startOfUtcDay(referenceDate) : addUtcDays(referenceDate, -1);

  while (workdays.length < count) {
    const normalized = startOfUtcDay(cursor);
    if (isWeekday(normalized)) {
      workdays.push(normalized);
    }
    cursor = addUtcDays(cursor, -1);
  }

  return workdays.reverse();
}
