import { isoWeekday, londonWallTimeToUtc, type LocalDate } from "./time";

export type SlotTemplate = {
  id: string;
  name: string;
  orderOpensMin: number;
  orderClosesMin: number;
  deliveryStartsMin: number;
  deliveryEndsMin: number;
  daysOfWeek: number[];
  capacity: number;
  closingSoonMinutes: number;
  isActive: boolean;
};

export type OccurrenceTimes = {
  localDate: LocalDate;
  orderOpensAt: Date;
  orderClosesAt: Date;
  deliveryStartsAt: Date;
  deliveryEndsAt: Date;
};

export type SlotStatus = "UPCOMING" | "OPEN" | "CLOSING_SOON" | "FULL" | "CLOSED";

export function runsOn(slot: Pick<SlotTemplate, "daysOfWeek" | "isActive">, date: LocalDate): boolean {
  return slot.isActive && slot.daysOfWeek.includes(isoWeekday(date));
}

/** Resolve a slot template on a London date to UTC instants. */
export function occurrenceTimes(
  slot: Pick<SlotTemplate, "orderOpensMin" | "orderClosesMin" | "deliveryStartsMin" | "deliveryEndsMin">,
  date: LocalDate,
): OccurrenceTimes {
  return {
    localDate: date,
    orderOpensAt: londonWallTimeToUtc(date, slot.orderOpensMin),
    orderClosesAt: londonWallTimeToUtc(date, slot.orderClosesMin),
    deliveryStartsAt: londonWallTimeToUtc(date, slot.deliveryStartsMin),
    deliveryEndsAt: londonWallTimeToUtc(date, slot.deliveryEndsMin),
  };
}

export type StatusInput = {
  times: Pick<OccurrenceTimes, "orderOpensAt" | "orderClosesAt">;
  capacity: number;
  activeOrders: number;
  closingSoonMinutes: number;
  /** Store closed, closure date, or slot inactive. */
  blocked: boolean;
  now: Date;
};

export function slotStatus(input: StatusInput): SlotStatus {
  const { times, now } = input;
  if (input.blocked || now.getTime() >= times.orderClosesAt.getTime()) return "CLOSED";
  if (now.getTime() < times.orderOpensAt.getTime()) return "UPCOMING";
  if (input.activeOrders >= input.capacity) return "FULL";
  const msLeft = times.orderClosesAt.getTime() - now.getTime();
  if (msLeft <= input.closingSoonMinutes * 60_000) return "CLOSING_SOON";
  return "OPEN";
}

export function isOrderable(status: SlotStatus): boolean {
  return status === "OPEN" || status === "CLOSING_SOON";
}

export const SLOT_STATUS_LABEL: Record<SlotStatus, string> = {
  UPCOMING: "Opens soon",
  OPEN: "Open",
  CLOSING_SOON: "Closing soon",
  FULL: "Full",
  CLOSED: "Closed",
};

export const WEEKDAYS = [
  { iso: 1, short: "Mon", long: "Monday" },
  { iso: 2, short: "Tue", long: "Tuesday" },
  { iso: 3, short: "Wed", long: "Wednesday" },
  { iso: 4, short: "Thu", long: "Thursday" },
  { iso: 5, short: "Fri", long: "Friday" },
  { iso: 6, short: "Sat", long: "Saturday" },
  { iso: 7, short: "Sun", long: "Sunday" },
] as const;

export function formatDays(days: readonly number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.join() === "1,2,3,4,5,6,7") return "Every day";
  if (sorted.join() === "1,2,3,4,5") return "Mon–Fri";
  if (sorted.join() === "6,7") return "Weekends";
  return sorted.map((d) => WEEKDAYS[d - 1].short).join(", ");
}
