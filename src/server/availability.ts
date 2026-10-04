import "server-only";
import { listOccurrences, occurrenceKey, type ExistingOccurrence, type Occurrence } from "@/shared/availability";
import { addDays, dbDateToLocalDate, localDateToDbDate, londonDate } from "@/shared/time";
import { getSettings, getSlotConfig } from "./catalog";
import { db } from "./db";

const LOOKAHEAD_DAYS = 8;

/**
 * Live slot occurrences with current capacity. Not cached: capacity changes with
 * every order. Slot templates and closures come from the cached config.
 */
export async function getOccurrences(now = new Date()): Promise<Occurrence[]> {
  const today = londonDate(now);
  const [config, settings] = await Promise.all([getSlotConfig(today), getSettings()]);
  const from = localDateToDbDate(today);
  const to = localDateToDbDate(addDays(today, LOOKAHEAD_DAYS));

  const occurrences = await db.slotOccurrence.findMany({
    where: { localDate: { gte: from, lt: to } },
    select: {
      id: true,
      slotId: true,
      localDate: true,
      orderOpensAt: true,
      orderClosesAt: true,
      deliveryStartsAt: true,
      deliveryEndsAt: true,
      capacity: true,
      restaurantCaps: true,
      _count: { select: { orders: { where: { status: { not: "CANCELLED" } } } } },
    },
  });

  const existing = new Map<string, ExistingOccurrence>();
  const activeOrders = new Map<string, number>();
  const keyById = new Map<string, string>();
  for (const o of occurrences) {
    const key = occurrenceKey(o.slotId, dbDateToLocalDate(o.localDate));
    keyById.set(o.id, key);
    existing.set(key, {
      times: { orderOpensAt: o.orderOpensAt, orderClosesAt: o.orderClosesAt, deliveryStartsAt: o.deliveryStartsAt, deliveryEndsAt: o.deliveryEndsAt },
      capacity: o.capacity,
      restaurantCaps: (o.restaurantCaps ?? {}) as Record<string, number>,
    });
    activeOrders.set(key, o._count.orders);
  }

  const restaurantCounts = new Map<string, Record<string, number>>();
  if (occurrences.length) {
    const rows = await db.$queryRaw<{ occ: string; restaurantId: string; n: number }[]>`
      SELECT o."slotOccurrenceId" AS occ, oi."restaurantId" AS "restaurantId", COUNT(DISTINCT o.id)::int AS n
      FROM "Order" o JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o."slotOccurrenceId" = ANY(${occurrences.map((o) => o.id)}) AND o.status <> 'CANCELLED'
      GROUP BY 1, 2`;
    for (const r of rows) {
      const key = keyById.get(r.occ)!;
      restaurantCounts.set(key, { ...(restaurantCounts.get(key) ?? {}), [r.restaurantId]: r.n });
    }
  }

  return listOccurrences({
    slots: config.slots,
    closures: new Set(config.closures),
    storeOpen: settings.storeOpen,
    now,
    days: LOOKAHEAD_DAYS,
    existing,
    activeOrders,
    restaurantCounts,
  });
}

/** Plain, serialisable view for client components. */
export type OccurrenceDTO = Omit<Occurrence, "orderOpensAt" | "orderClosesAt" | "deliveryStartsAt" | "deliveryEndsAt"> & {
  orderOpensAt: string;
  orderClosesAt: string;
  deliveryStartsAt: string;
  deliveryEndsAt: string;
};

export function toDTO(o: Occurrence): OccurrenceDTO {
  return {
    ...o,
    orderOpensAt: o.orderOpensAt.toISOString(),
    orderClosesAt: o.orderClosesAt.toISOString(),
    deliveryStartsAt: o.deliveryStartsAt.toISOString(),
    deliveryEndsAt: o.deliveryEndsAt.toISOString(),
  };
}
