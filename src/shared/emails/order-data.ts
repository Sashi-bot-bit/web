import type { Allergen } from "@/generated/prisma/enums";
import { allergenLabel, allergenSummary } from "../allergens";
import { formatLondonTime, formatLocalDate, dbDateToLocalDate } from "../time";
import type { OrderEmailData } from "./order";

/** Shape both apps load from the DB to build order emails. */
export type OrderForEmail = {
  id: string;
  number: string;
  contactName: string;
  dropPointSnapshot: unknown;
  subtotalPence: number;
  totalPence: number;
  items: { restaurantName: string; name: string; quantity: number; lineTotalPence: number; allergens: Allergen[]; mayContain: Allergen[]; noAllergens: boolean }[];
  fees: { label: string; chargedPence: number }[];
  slotOccurrence: { localDate: Date; deliveryStartsAt: Date; deliveryEndsAt: Date; slot: { name: string } };
};

export const ORDER_EMAIL_INCLUDE = {
  items: true,
  fees: true,
  slotOccurrence: { include: { slot: { select: { name: true } } } },
} as const;

export function deliveryWindowText(o: OrderForEmail["slotOccurrence"]): string {
  return `${formatLocalDate(dbDateToLocalDate(o.localDate))}, ${formatLondonTime(o.deliveryStartsAt)}–${formatLondonTime(o.deliveryEndsAt)}`;
}

export function buildOrderEmailData(
  order: OrderForEmail,
  ctx: { brand: string; paymentInstructions: string; supportEmail: string | null; trackUrl: string },
): OrderEmailData {
  const dp = order.dropPointSnapshot as OrderEmailData["dropPoint"];
  const byRestaurant = new Map<string, OrderEmailData["restaurants"][number]>();
  for (const i of order.items) {
    const group = byRestaurant.get(i.restaurantName) ?? { name: i.restaurantName, items: [] };
    group.items.push({
      name: i.name,
      quantity: i.quantity,
      lineTotalPence: i.lineTotalPence,
      contains: allergenSummary(i.allergens, i.noAllergens),
      mayContain: i.mayContain.map(allergenLabel),
    });
    byRestaurant.set(i.restaurantName, group);
  }
  return {
    brand: ctx.brand,
    number: order.number,
    customerName: order.contactName,
    slotName: order.slotOccurrence.slot.name,
    deliveryWindow: deliveryWindowText(order.slotOccurrence),
    dropPoint: { name: dp.name, description: dp.description, directions: dp.directions ?? null, mapUrl: dp.mapUrl ?? null },
    restaurants: [...byRestaurant.values()],
    fees: order.fees.map((f) => ({ label: f.label, chargedPence: f.chargedPence })),
    subtotalPence: order.subtotalPence,
    totalPence: order.totalPence,
    paymentInstructions: ctx.paymentInstructions,
    trackUrl: ctx.trackUrl,
    supportEmail: ctx.supportEmail,
  };
}
