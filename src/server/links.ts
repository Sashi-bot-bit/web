import "server-only";
import { accessToken } from "@/shared/access-token";
import { env } from "./env";

export function orderUrl(orderId: string) {
  return `${env.NEXT_PUBLIC_SHOP_URL}/orders/${orderId}?t=${accessToken(env.ORDER_LINK_SECRET, "order", orderId)}`;
}
export function orderPath(orderId: string) {
  return `/orders/${orderId}?t=${accessToken(env.ORDER_LINK_SECRET, "order", orderId)}`;
}
export function ticketUrl(ticketId: string) {
  return `${env.NEXT_PUBLIC_SHOP_URL}/support/${ticketId}?t=${accessToken(env.ORDER_LINK_SECRET, "ticket", ticketId)}`;
}
export function ticketPath(ticketId: string) {
  return `/support/${ticketId}?t=${accessToken(env.ORDER_LINK_SECRET, "ticket", ticketId)}`;
}
