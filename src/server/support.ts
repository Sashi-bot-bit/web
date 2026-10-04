import "server-only";
import { linkStillValid, verifyAccessToken } from "@/shared/access-token";
import { db } from "./db";
import { env } from "./env";
import { currentCustomer } from "./session";

/** Ticket visible to its signed-in owner or a valid tokenised link. */
export async function findViewableTicket(ticketId: string, token: string | null | undefined) {
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: "asc" } }, order: { select: { id: true, number: true } } },
  });
  if (!ticket) return null;
  const customer = await currentCustomer();
  if (customer && ticket.userId === customer.id) return ticket;
  if (verifyAccessToken(env.ORDER_LINK_SECRET, "ticket", ticket.id, token) && linkStillValid(ticket.createdAt)) return ticket;
  return null;
}

