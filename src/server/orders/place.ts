import "server-only";
import { randomInt } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { restaurantOpenIn } from "@/shared/availability";
import { normaliseAllergens } from "@/shared/allergens";
import { occurrenceTimes, runsOn } from "@/shared/slots";
import { localDateToDbDate, londonDate } from "@/shared/time";
import type { PlaceOrderInput } from "@/shared/validation/checkout";
import { getDropPoints, getSettings } from "../catalog";
import { db } from "../db";
import { quoteCart, type CartQuote } from "../quote";

export type PlaceOrderErrorCode =
  | "STORE_CLOSED"
  | "SLOT_UNAVAILABLE"
  | "SLOT_CLOSED"
  | "SLOT_FULL"
  | "RESTAURANT_FULL"
  | "ITEMS_UNAVAILABLE"
  | "PRICE_CHANGED"
  | "TOO_MANY_ITEMS"
  | "DROP_POINT_UNAVAILABLE"
  | "CONTACT_BLOCKED"
  | "CONTACT_LIMIT";

export class PlaceOrderError extends Error {
  constructor(
    public code: PlaceOrderErrorCode,
    message: string,
    public detail?: { quote?: CartQuote; restaurants?: string[] },
  ) {
    super(message);
  }
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newOrderNumber(): string {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)];
  return `${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}`;
}

type Placed = { id: string; number: string };

/**
 * Places a pay-on-delivery order. Capacity, cutoff, per-restaurant caps and the
 * per-contact limit are checked while holding a row lock on the slot occurrence,
 * so concurrent checkouts can never oversell.
 */
export async function placeOrder(input: PlaceOrderInput, customer: { id: string } | null, now = new Date()): Promise<Placed> {
  const settings = await getSettings();
  if (!settings.storeOpen) throw new PlaceOrderError("STORE_CLOSED", "We’re not taking orders right now.");

  const totalQty = input.lines.reduce((n, l) => n + l.quantity, 0);
  if (totalQty > settings.maxItemsPerOrder || input.lines.some((l) => l.quantity > settings.maxQtyPerLine)) {
    throw new PlaceOrderError(
      "TOO_MANY_ITEMS",
      `Orders are limited to ${settings.maxItemsPerOrder} items, and ${settings.maxQtyPerLine} of any one item.`,
    );
  }

  const quote = await quoteCart(input.lines);
  if (quote.problems.length) {
    throw new PlaceOrderError("ITEMS_UNAVAILABLE", "Some items are no longer available. Review your basket.", { quote });
  }
  if (quote.totalPence !== input.expectedTotalPence) {
    throw new PlaceOrderError("PRICE_CHANGED", "Prices have changed since you opened your basket. Check the new total.", { quote });
  }

  const dropPoint = (await getDropPoints()).find((d) => d.id === input.dropPointId);
  if (!dropPoint) throw new PlaceOrderError("DROP_POINT_UNAVAILABLE", "That drop point isn’t available. Choose another.");

  const slot = await db.slot.findUnique({ where: { id: input.slotId }, include: { restaurantCaps: true } });
  const closed = await db.closureDate.findUnique({ where: { localDate: localDateToDbDate(input.localDate) } });
  if (!slot || !runsOn(slot, input.localDate) || closed || input.localDate < londonDate(now)) {
    throw new PlaceOrderError("SLOT_UNAVAILABLE", "That delivery slot isn’t available. Choose another.");
  }

  const blocked = await db.contactBlock.findFirst({
    where: {
      clearedAt: null,
      OR: [
        { kind: "EMAIL", value: input.email },
        { kind: "PHONE", value: input.phone },
      ],
    },
    select: { id: true },
  });
  if (blocked) {
    throw new PlaceOrderError(
      "CONTACT_BLOCKED",
      `We can’t take orders for these contact details at the moment. Please contact ${settings.supportEmail ?? "support"}.`,
    );
  }

  const restaurantIds = [...new Set(quote.lines.map((l) => l.restaurantId))];
  const times = occurrenceTimes(slot, input.localDate);
  const caps = Object.fromEntries(slot.restaurantCaps.map((c) => [c.restaurantId, c.maxOrders]));
  const dbDate = localDateToDbDate(input.localDate);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          await tx.$executeRaw`
            INSERT INTO "SlotOccurrence" ("id", "slotId", "localDate", "orderOpensAt", "orderClosesAt", "deliveryStartsAt", "deliveryEndsAt", "capacity", "restaurantCaps", "createdAt")
            VALUES (${`occ_${slot.id}_${input.localDate}`}, ${slot.id}, ${dbDate}::date, ${times.orderOpensAt}, ${times.orderClosesAt}, ${times.deliveryStartsAt}, ${times.deliveryEndsAt}, ${slot.capacity}, ${JSON.stringify(caps)}::jsonb, now())
            ON CONFLICT DO NOTHING`;
          const [occ] = await tx.$queryRaw<
            { id: string; orderOpensAt: Date; orderClosesAt: Date; capacity: number; restaurantCaps: Record<string, number> }[]
          >`SELECT "id", "orderOpensAt", "orderClosesAt", "capacity", "restaurantCaps" FROM "SlotOccurrence"
            WHERE "slotId" = ${slot.id} AND "localDate" = ${dbDate}::date FOR UPDATE`;

          if (now < occ.orderOpensAt || now >= occ.orderClosesAt) {
            throw new PlaceOrderError("SLOT_CLOSED", "Ordering for that slot has closed. Choose another slot.");
          }

          const active = await tx.order.count({ where: { slotOccurrenceId: occ.id, status: { not: "CANCELLED" } } });
          if (active >= occ.capacity) throw new PlaceOrderError("SLOT_FULL", "That slot has just filled up. Choose another slot.");

          const counts = await tx.$queryRaw<{ restaurantId: string; n: number }[]>`
            SELECT oi."restaurantId" AS "restaurantId", COUNT(DISTINCT o.id)::int AS n
            FROM "Order" o JOIN "OrderItem" oi ON oi."orderId" = o.id
            WHERE o."slotOccurrenceId" = ${occ.id} AND o.status <> 'CANCELLED' AND oi."restaurantId" = ANY(${restaurantIds})
            GROUP BY 1`;
          const restaurantCounts = Object.fromEntries(counts.map((c) => [c.restaurantId, c.n]));
          const full = restaurantIds.filter((rid) => !restaurantOpenIn({ restaurantCaps: occ.restaurantCaps ?? {}, restaurantCounts }, rid));
          if (full.length) {
            const names = [...new Set(quote.lines.filter((l) => full.includes(l.restaurantId)).map((l) => l.restaurantName))];
            throw new PlaceOrderError(
              "RESTAURANT_FULL",
              `${names.join(" and ")} ${names.length > 1 ? "aren’t" : "isn’t"} taking more orders for this slot. Choose another slot or remove ${names.length > 1 ? "those items" : "its items"}.`,
              { restaurants: names },
            );
          }

          const mine = await tx.order.count({
            where: {
              slotOccurrenceId: occ.id,
              status: { not: "CANCELLED" },
              OR: [{ contactEmail: input.email }, { contactPhone: input.phone }],
            },
          });
          if (mine >= settings.maxActiveOrdersPerContactPerSlot) {
            throw new PlaceOrderError(
              "CONTACT_LIMIT",
              `You already have ${mine} order${mine === 1 ? "" : "s"} in this slot, which is the limit. Add to an existing order by contacting us, or choose another slot.`,
            );
          }

          const order = await tx.order.create({
            data: {
              number: newOrderNumber(),
              userId: customer?.id ?? null,
              contactName: input.name,
              contactEmail: input.email,
              contactPhone: input.phone,
              slotOccurrenceId: occ.id,
              dropPointId: dropPoint.id,
              dropPointSnapshot: dropPoint,
              subtotalPence: quote.subtotalPence,
              feesPence: quote.feesPence,
              totalPence: quote.totalPence,
              termsAcceptedAt: now,
              marketingOptIn: input.marketingOptIn,
              placedAt: now,
              items: {
                create: quote.lines.map((l) => ({
                  menuItemId: l.menuItemId,
                  restaurantId: l.restaurantId,
                  restaurantName: l.restaurantName,
                  name: l.name,
                  unitPricePence: l.unitPricePence,
                  originalUnitPricePence: l.originalUnitPricePence,
                  quantity: l.quantity,
                  lineTotalPence: l.lineTotalPence,
                  allergens: normaliseAllergens(l.allergens),
                  mayContain: normaliseAllergens(l.mayContain),
                  dietaryLabels: l.dietaryLabels,
                  kcal: l.kcal,
                })),
              },
              fees: {
                create: quote.fees.map((f) => ({
                  feeId: f.id,
                  label: f.label,
                  type: f.type,
                  amountPence: f.amountPence,
                  basisPoints: f.basisPoints,
                  chargedPence: f.chargedPence,
                })),
              },
              events: { create: { from: null, to: "CONFIRMED", actorType: customer ? "CUSTOMER" : "SYSTEM", actorId: customer?.id ?? null } },
            },
            select: { id: true, number: true },
          });
          return order;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 10_000, maxWait: 5_000 },
      );
    } catch (error) {
      // Order number collision (vanishingly rare): retry with a new number.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 2) continue;
      throw error;
    }
  }
  throw new Error("Could not allocate an order number");
}
