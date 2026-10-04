import "server-only";
import { canTransition } from "@/shared/order-state";
import { db } from "../db";

export class CancelError extends Error {}

/** Customer cancellation: only a confirmed order, only before the ordering cutoff. */
export async function cancelByCustomer(orderId: string, actorId: string | null, now = new Date()) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, slotOccurrence: { select: { orderClosesAt: true } } },
    });
    if (!order) throw new CancelError("Order not found.");
    if (!canTransition(order.status, "CANCELLED", "CUSTOMER", { orderClosesAt: order.slotOccurrence.orderClosesAt, now })) {
      throw new CancelError(
        order.status === "CANCELLED"
          ? "This order is already cancelled."
          : "Ordering has closed for this slot, so the order can’t be cancelled online. Contact us instead.",
      );
    }
    const updated = await tx.order.updateMany({
      where: { id: orderId, status: "CONFIRMED" },
      data: { status: "CANCELLED", cancelledAt: now, cancelledBy: "CUSTOMER", cancelReason: "Cancelled by customer" },
    });
    if (updated.count !== 1) throw new CancelError("This order has changed. Refresh the page.");
    await tx.orderStatusEvent.create({
      data: { orderId, from: "CONFIRMED", to: "CANCELLED", actorType: "CUSTOMER", actorId, note: "Cancelled by customer" },
    });
  });
}
