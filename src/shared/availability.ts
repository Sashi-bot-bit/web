import { isOrderable, occurrenceTimes, runsOn, slotStatus, type OccurrenceTimes, type SlotStatus, type SlotTemplate } from "./slots";
import { addDays, londonDate, type LocalDate } from "./time";

/** A slot occurrence as customers see it, with live capacity. */
export type Occurrence = OccurrenceTimes & {
  key: string; // `${slotId}:${localDate}`
  slotId: string;
  slotName: string;
  capacity: number;
  activeOrders: number;
  closingSoonMinutes: number;
  status: SlotStatus;
  /** Max orders per restaurant for this occurrence (absent = no limit). */
  restaurantCaps: Record<string, number>;
  /** Active orders that include each restaurant. */
  restaurantCounts: Record<string, number>;
};

export type ExistingOccurrence = {
  times: Omit<OccurrenceTimes, "localDate">;
  capacity: number;
  restaurantCaps: Record<string, number>;
};

export type AvailabilityInput = {
  slots: (SlotTemplate & { restaurantCaps: Record<string, number> })[];
  closures: ReadonlySet<LocalDate>;
  storeOpen: boolean;
  now: Date;
  /** How many London dates to look ahead, including today. */
  days: number;
  /** Snapshots for occurrences that already have orders, keyed by `${slotId}:${date}`. */
  existing: ReadonlyMap<string, ExistingOccurrence>;
  activeOrders: ReadonlyMap<string, number>;
  restaurantCounts: ReadonlyMap<string, Record<string, number>>;
};

export const occurrenceKey = (slotId: string, date: LocalDate) => `${slotId}:${date}`;

/**
 * Every occurrence from today for `days` days, soonest cutoff first. Past and
 * closed occurrences are included (status CLOSED) so callers can explain why.
 * Occurrences that already have orders use their snapshot times and capacity.
 */
export function listOccurrences(input: AvailabilityInput): Occurrence[] {
  const today = londonDate(input.now);
  const out: Occurrence[] = [];
  for (let d = 0; d < input.days; d++) {
    const date = addDays(today, d);
    for (const slot of input.slots) {
      if (!runsOn(slot, date)) continue;
      const key = occurrenceKey(slot.id, date);
      const snap = input.existing.get(key);
      const times = snap ? { localDate: date, ...snap.times } : occurrenceTimes(slot, date);
      const capacity = snap?.capacity ?? slot.capacity;
      const activeOrders = input.activeOrders.get(key) ?? 0;
      const status = slotStatus({
        times,
        capacity,
        activeOrders,
        closingSoonMinutes: slot.closingSoonMinutes,
        blocked: !input.storeOpen || input.closures.has(date),
        now: input.now,
      });
      out.push({
        ...times,
        key,
        slotId: slot.id,
        slotName: slot.name,
        capacity,
        activeOrders,
        closingSoonMinutes: slot.closingSoonMinutes,
        status,
        restaurantCaps: snap?.restaurantCaps ?? slot.restaurantCaps,
        restaurantCounts: input.restaurantCounts.get(key) ?? {},
      });
    }
  }
  return out.sort((a, b) => a.orderClosesAt.getTime() - b.orderClosesAt.getTime());
}

/** Restaurant still accepting orders in this occurrence (per-restaurant cap). */
export function restaurantOpenIn(occ: Pick<Occurrence, "restaurantCaps" | "restaurantCounts">, restaurantId: string): boolean {
  const cap = occ.restaurantCaps[restaurantId];
  if (cap === undefined) return true;
  return (occ.restaurantCounts[restaurantId] ?? 0) < cap;
}

/** The occurrence to feature: one taking orders now, else the next to open. */
export function featuredOccurrence(occurrences: readonly Occurrence[], now: Date): Occurrence | null {
  const orderable = occurrences.find((o) => isOrderable(o.status));
  if (orderable) return orderable;
  return occurrences.find((o) => o.status === "UPCOMING" && o.orderOpensAt.getTime() > now.getTime()) ?? null;
}

export function isOrderableStatus(status: SlotStatus): boolean {
  return isOrderable(status);
}

export function orderableOccurrences(occurrences: readonly Occurrence[]): Occurrence[] {
  return occurrences.filter((o) => isOrderable(o.status));
}

/** Short human countdown: "1 hr 5 min", "12 min", "45 sec". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h} hr${m ? ` ${m} min` : ""}`;
  if (m > 0) return `${m} min`;
  return `${s} sec`;
}
