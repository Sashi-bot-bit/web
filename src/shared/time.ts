import { TZDate } from "@date-fns/tz";

/**
 * Every Europe/London calculation goes through this module. The DB stores UTC.
 * A "local date" is an ISO calendar date string (YYYY-MM-DD) in London.
 */
export const TZ = "Europe/London";

export type LocalDate = string; // "2026-10-25"

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isLocalDate(value: string): value is LocalDate {
  if (!LOCAL_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** The London calendar date for an instant. */
export function londonDate(instant: Date): LocalDate {
  const z = new TZDate(instant.getTime(), TZ);
  return `${z.getFullYear()}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
}

/** Minutes after London midnight for an instant (0–1439). */
export function londonMinutes(instant: Date): number {
  const z = new TZDate(instant.getTime(), TZ);
  return z.getHours() * 60 + z.getMinutes();
}

/** ISO weekday (1 = Monday … 7 = Sunday) of a London calendar date. */
export function isoWeekday(date: LocalDate): number {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

/**
 * London wall-clock time on a date → UTC instant.
 * Slot validation forbids 01:00–02:59 local, so we never resolve a time that
 * does not exist (spring forward) or exists twice (fall back).
 */
export function londonWallTimeToUtc(date: LocalDate, minutesAfterMidnight: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  const h = Math.floor(minutesAfterMidnight / 60);
  const min = minutesAfterMidnight % 60;
  if (h === 24 && min === 0) {
    return londonWallTimeToUtc(addDays(date, 1), 0);
  }
  return new Date(new TZDate(y, m - 1, d, h, min, 0, 0, TZ).getTime());
}

/** Calendar date stored in a Postgres DATE column (Prisma maps it to UTC midnight). */
export function localDateToDbDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function dbDateToLocalDate(value: Date): LocalDate {
  return value.toISOString().slice(0, 10);
}

/** "11:30" → 690. Returns null when malformed. */
export function hhmmToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 690 → "11:30"; 1440 → "24:00". */
export function minutesToHhmm(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** True when a wall-clock minute value falls in the DST-sensitive 01:00–02:59 band. */
export function isDstSensitiveMinute(minutes: number): boolean {
  return minutes >= 60 && minutes < 180;
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatLondonTime(instant: Date): string {
  return timeFmt.format(instant);
}
export function formatLondonDate(instant: Date): string {
  return dateFmt.format(instant);
}
export function formatLondonDateTime(instant: Date): string {
  return dateTimeFmt.format(instant);
}
/** Format a LocalDate for display without timezone drift. */
export function formatLocalDate(date: LocalDate): string {
  return dateFmt.format(londonWallTimeToUtc(date, 12 * 60));
}
