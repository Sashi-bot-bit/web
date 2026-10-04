import "server-only";
import { linkStillValid, verifyAccessToken } from "@/shared/access-token";
import { db } from "../db";
import { env } from "../env";
import { currentCustomer } from "../session";

export const ORDER_VIEW_INCLUDE = {
  items: { orderBy: { restaurantName: "asc" } },
  fees: true,
  events: { orderBy: { at: "asc" } },
  slotOccurrence: { include: { slot: { select: { name: true } } } },
} as const;

/**
 * An order is visible to its signed-in owner, or to anyone holding a valid
 * tokenised link (guests) within the link lifetime. Anything else is a 404.
 */
export async function findViewableOrder(orderId: string, token: string | null | undefined) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: ORDER_VIEW_INCLUDE });
  if (!order) return null;
  const customer = await currentCustomer();
  if (customer && order.userId === customer.id) return { order, viewer: "owner" as const };
  if (verifyAccessToken(env.ORDER_LINK_SECRET, "order", order.id, token) && linkStillValid(order.placedAt)) {
    return { order, viewer: "link" as const };
  }
  return null;
}

/**
 * Attach past guest orders to an account once its email is verified, so nobody
 * can claim orders by signing up with someone else's address.
 */
export async function attachGuestOrders(customer: { id: string; email: string; emailVerified: boolean }) {
  if (!customer.emailVerified) return 0;
  const { count } = await db.order.updateMany({
    where: { userId: null, contactEmail: customer.email.toLowerCase() },
    data: { userId: customer.id },
  });
  await db.supportTicket.updateMany({ where: { userId: null, contactEmail: customer.email.toLowerCase() }, data: { userId: customer.id } });
  return count;
}
