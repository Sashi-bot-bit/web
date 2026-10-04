import { findViewableOrder } from "@/server/orders/access";
import { clientIp, rateLimit } from "@/server/ratelimit";

/** Lightweight status endpoint polled by the order page every 20 s. */
export async function GET(request: Request, ctx: { params: Promise<{ orderId: string }> }) {
  if (!(await rateLimit("poll", await clientIp(), 60, 60))) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }
  const { orderId } = await ctx.params;
  const token = new URL(request.url).searchParams.get("t");
  const found = await findViewableOrder(orderId, token);
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });
  const { order } = found;
  return Response.json(
    { status: order.status, paymentStatus: order.paymentStatus, updatedAt: order.updatedAt.toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
