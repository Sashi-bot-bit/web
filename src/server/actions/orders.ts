"use server";

import { after } from "next/server";
import { log } from "../log";
import { CancelError, cancelByCustomer } from "../orders/cancel";
import { findViewableOrder } from "../orders/access";
import { sendOrderCancelled } from "../orders/email";
import { clientIp, rateLimit } from "../ratelimit";
import { currentCustomer } from "../session";

export async function cancelOrderAction(orderId: string, token: string | null): Promise<{ ok: boolean; message: string }> {
  if (!(await rateLimit("cancel", await clientIp(), 10, 3600))) {
    return { ok: false, message: "Too many attempts. Try again later." };
  }
  const found = await findViewableOrder(String(orderId), token);
  if (!found) return { ok: false, message: "Order not found." };
  try {
    const customer = await currentCustomer();
    await cancelByCustomer(found.order.id, customer?.id ?? null);
    after(async () => {
      try {
        await sendOrderCancelled(found.order.id, true);
      } catch (error) {
        log.error("cancel_email_failed", { orderId: found.order.id, error });
      }
    });
    return { ok: true, message: "Your order is cancelled. Nothing is owed." };
  } catch (error) {
    if (error instanceof CancelError) return { ok: false, message: error.message };
    log.error("cancel_failed", { error });
    return { ok: false, message: "Something went wrong. Try again." };
  }
}
