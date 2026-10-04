import "server-only";
import { buildOrderEmailData, ORDER_EMAIL_INCLUDE } from "@/shared/emails/order-data";
import { OrderCancelledEmail, OrderConfirmationEmail } from "@/shared/emails/order";
import { getSettings } from "../catalog";
import { db } from "../db";
import { sendEmail } from "../email/send";
import { orderUrl } from "../links";

async function load(orderId: string) {
  const [order, settings] = await Promise.all([
    db.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_EMAIL_INCLUDE }),
    getSettings(),
  ]);
  const data = buildOrderEmailData(order, {
    brand: settings.brandName,
    paymentInstructions: settings.paymentInstructions,
    supportEmail: settings.supportEmail,
    trackUrl: orderUrl(order.id),
  });
  return { order, data };
}

export async function sendOrderConfirmation(orderId: string) {
  const { order, data } = await load(orderId);
  await sendEmail({
    to: order.contactEmail,
    subject: `Order ${order.number} confirmed: pay ${(order.totalPence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })} on delivery`,
    type: "order_confirmed",
    dedupeKey: `order:${order.id}:CONFIRMED`,
    email: <OrderConfirmationEmail order={data} />,
  });
}

export async function sendOrderCancelled(orderId: string, byCustomer: boolean) {
  const { order, data } = await load(orderId);
  await sendEmail({
    to: order.contactEmail,
    subject: `Order ${order.number} cancelled`,
    type: "order_cancelled",
    dedupeKey: `order:${order.id}:CANCELLED`,
    email: <OrderCancelledEmail order={data} reason={order.cancelReason} byCustomer={byCustomer} />,
  });
}
