"use server";

import { after } from "next/server";
import { z } from "zod";
import { cartInput, placeOrderInput } from "@/shared/validation/checkout";
import { db } from "../db";
import { orderPath } from "../links";
import { log } from "../log";
import { sendOrderConfirmation } from "../orders/email";
import { PlaceOrderError, placeOrder, type PlaceOrderErrorCode } from "../orders/place";
import { quoteCart, type CartQuote } from "../quote";
import { clientIp, rateLimit } from "../ratelimit";
import { currentCustomer } from "../session";

export async function quoteCartAction(lines: unknown): Promise<CartQuote | null> {
  const parsed = cartInput.safeParse(lines);
  if (!parsed.success) return null;
  if (!(await rateLimit("quote", await clientIp(), 120, 60))) return null;
  return quoteCart(parsed.data);
}

export type PlaceOrderResult =
  | { ok: true; path: string; number: string }
  | { ok: false; code: PlaceOrderErrorCode | "INVALID" | "RATE_LIMITED" | "ERROR"; message: string; fieldErrors?: Record<string, string[] | undefined>; quote?: CartQuote };

export async function placeOrderAction(raw: unknown): Promise<PlaceOrderResult> {
  const customer = await currentCustomer();
  const parsed = placeOrderInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "INVALID", message: "Check the highlighted details.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  // Signed-in customers always order under their account email.
  const input = customer ? { ...parsed.data, email: customer.email.toLowerCase() } : parsed.data;

  const ip = await clientIp();
  if (!(await rateLimit("order:ip", ip, 10, 600)) || !(await rateLimit("order:contact", `${input.email}|${input.phone}`, 5, 600))) {
    return { ok: false, code: "RATE_LIMITED", message: "Too many orders in a short time. Wait a few minutes, then try again." };
  }

  try {
    const order = await placeOrder(input, customer);
    if (customer) {
      await db.user.update({ where: { id: customer.id }, data: { phone: input.phone } }).catch(() => undefined);
    }
    after(async () => {
      try {
        await sendOrderConfirmation(order.id);
      } catch (error) {
        log.error("order_confirmation_email_failed", { orderId: order.id, error });
      }
    });
    log.info("order_placed", { orderId: order.id });
    return { ok: true, path: `${orderPath(order.id)}&placed=1`, number: order.number };
  } catch (error) {
    if (error instanceof PlaceOrderError) {
      return { ok: false, code: error.code, message: error.message, quote: error.detail?.quote };
    }
    log.error("place_order_failed", { error });
    return { ok: false, code: "ERROR", message: "Something went wrong and your order wasn’t placed. Try again." };
  }
}
