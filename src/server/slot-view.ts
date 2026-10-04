import "server-only";
import { type Occurrence } from "@/shared/availability";
import { formatLocalDate, formatLondonTime, addDays, type LocalDate } from "@/shared/time";

export function dayLabel(date: LocalDate, today: LocalDate): string {
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  return formatLocalDate(date);
}

/** Display strings for an occurrence, formatted in London time on the server. */
export type SlotView = {
  key: string;
  slotId: string;
  localDate: string;
  slotName: string;
  day: string;
  status: Occurrence["status"];
  orderOpens: string;
  orderCloses: string;
  deliveryWindow: string;
  orderOpensAt: string;
  orderClosesAt: string;
  spacesLeft: number;
  restaurantCaps: Record<string, number>;
  restaurantCounts: Record<string, number>;
};

export function toSlotView(o: Occurrence, today: LocalDate): SlotView {
  return {
    key: o.key,
    slotId: o.slotId,
    localDate: o.localDate,
    slotName: o.slotName,
    day: dayLabel(o.localDate, today),
    status: o.status,
    orderOpens: formatLondonTime(o.orderOpensAt),
    orderCloses: formatLondonTime(o.orderClosesAt),
    deliveryWindow: `${formatLondonTime(o.deliveryStartsAt)}–${formatLondonTime(o.deliveryEndsAt)}`,
    orderOpensAt: o.orderOpensAt.toISOString(),
    orderClosesAt: o.orderClosesAt.toISOString(),
    spacesLeft: Math.max(0, o.capacity - o.activeOrders),
    restaurantCaps: o.restaurantCaps,
    restaurantCounts: o.restaurantCounts,
  };
}
