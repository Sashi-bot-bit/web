"use server";

import { randomInt } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { TicketReceivedEmail } from "@/shared/emails/support";
import { ticketInput, ticketReplyInput } from "@/shared/validation/checkout";
import { getSettings } from "../catalog";
import { db } from "../db";
import { sendEmail } from "../email/send";
import { ticketPath, ticketUrl } from "../links";
import { log } from "../log";
import { findViewableOrder } from "../orders/access";
import { findViewableTicket } from "../support";
import { clientIp, rateLimit } from "../ratelimit";
import { currentCustomer } from "../session";

type Result = { ok: boolean; message: string; errors?: Record<string, string[] | undefined>; path?: string };

function ticketNumber() {
  const digits = Array.from({ length: 6 }, () => randomInt(10)).join("");
  return `T-${digits}`;
}

export async function createTicketAction(raw: unknown, orderToken: string | null): Promise<Result> {
  const customer = await currentCustomer();
  const base = typeof raw === "object" && raw ? (raw as Record<string, unknown>) : {};
  const parsed = ticketInput.safeParse(customer ? { ...base, name: customer.name, email: customer.email } : base);
  if (!parsed.success) return { ok: false, message: "Check the highlighted details.", errors: z.flattenError(parsed.error).fieldErrors };
  if (!(await rateLimit("ticket", await clientIp(), 5, 3600))) {
    return { ok: false, message: "You’ve sent several messages recently. Try again in an hour, or email us." };
  }
  const input = parsed.data;

  // Only link an order the person can actually see.
  let orderId: string | null = null;
  if (input.orderId) {
    const found = await findViewableOrder(input.orderId, orderToken);
    if (found) orderId = found.order.id;
  }

  let ticket: { id: string; number: string } | null = null;
  for (let attempt = 0; attempt < 3 && !ticket; attempt++) {
    try {
      ticket = await db.supportTicket.create({
        data: {
          number: ticketNumber(),
          userId: customer?.id ?? null,
          orderId,
          contactName: input.name,
          contactEmail: input.email,
          subject: input.subject,
          messages: { create: { authorType: "CUSTOMER", authorId: customer?.id ?? null, body: input.message } },
        },
        select: { id: true, number: true },
      });
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  const created = ticket!;
  after(async () => {
    try {
      const settings = await getSettings();
      await sendEmail({
        to: input.email,
        subject: `We’ve received your message (${created.number})`,
        type: "ticket_received",
        dedupeKey: `ticket:${created.id}:RECEIVED`,
        email: <TicketReceivedEmail brand={settings.brandName} name={input.name} number={created.number} subject={input.subject} url={ticketUrl(created.id)} />,
      });
    } catch (error) {
      log.error("ticket_email_failed", { ticketId: created.id, error });
    }
  });
  return { ok: true, message: "Message sent.", path: ticketPath(created.id) };
}

export async function replyTicketAction(ticketId: string, token: string | null, raw: unknown): Promise<Result> {
  const parsed = ticketReplyInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Write a message first.", errors: z.flattenError(parsed.error).fieldErrors };
  if (!(await rateLimit("ticket-reply", await clientIp(), 20, 3600))) return { ok: false, message: "Too many messages. Try again later." };
  const ticket = await findViewableTicket(String(ticketId), token);
  if (!ticket) return { ok: false, message: "Conversation not found." };
  const customer = await currentCustomer();
  await db.$transaction([
    db.ticketMessage.create({ data: { ticketId: ticket.id, authorType: "CUSTOMER", authorId: customer?.id ?? null, body: parsed.data.message } }),
    db.supportTicket.update({ where: { id: ticket.id }, data: { status: "OPEN", resolvedAt: null } }),
  ]);
  return { ok: true, message: "Reply sent." };
}
