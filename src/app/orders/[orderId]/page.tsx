import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Check, CircleX, ExternalLink, MapPin, UserX, Wallet } from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/enums";
import { canTransition } from "@/shared/order-state";
import { dbDateToLocalDate, formatLocalDate, formatLondonDateTime, formatLondonTime } from "@/shared/time";
import { getSettings } from "@/server/catalog";
import { findViewableOrder } from "@/server/orders/access";
import { cn } from "@/components/ui/cn";
import { AllergenInfo } from "@/components/shop/food-info";
import { OrderSummary } from "@/components/shop/order-summary";
import { OrderChip } from "@/components/shop/status-chips";
import { formatPence } from "@/shared/money";
import { CancelOrderButton } from "./cancel-button";
import { StatusPoller } from "./status-poller";

export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

type Props = { params: Promise<{ orderId: string }>; searchParams: Promise<{ t?: string; placed?: string }> };

const STEPS: { status: OrderStatus; label: string; detail: string }[] = [
  { status: "CONFIRMED", label: "Order confirmed", detail: "We’ve got your order." },
  { status: "PREPARING", label: "Being prepared", detail: "The restaurant is making your food." },
  { status: "IN_TRANSIT", label: "On the way", detail: "Heading to your drop point." },
  { status: "DELIVERED", label: "Collected", detail: "Enjoy your meal." },
];

async function OrderContent({ params, searchParams }: Props) {
  await connection();
  const [{ orderId }, { t, placed }] = await Promise.all([params, searchParams]);
  const [found, settings] = await Promise.all([findViewableOrder(orderId, t), getSettings()]);
  if (!found) notFound();
  const { order } = found;
  const occ = order.slotOccurrence;
  const dp = order.dropPointSnapshot as { name: string; description: string; directions: string | null; mapUrl: string | null };
  const stamps: Partial<Record<OrderStatus, Date | null>> = {
    CONFIRMED: order.placedAt,
    PREPARING: order.preparingAt,
    IN_TRANSIT: order.inTransitAt,
    DELIVERED: order.deliveredAt,
  };
  const currentIndex = STEPS.findIndex((s) => s.status === order.status);
  const day = formatLocalDate(dbDateToLocalDate(occ.localDate));
  const window = `${formatLondonTime(occ.deliveryStartsAt)}–${formatLondonTime(occ.deliveryEndsAt)}`;
  const canCancel = canTransition(order.status, "CANCELLED", "CUSTOMER", { orderClosesAt: occ.orderClosesAt });
  const terminalBad = order.status === "CANCELLED" || order.status === "NOT_COLLECTED";

  const byRestaurant = new Map<string, typeof order.items>();
  for (const i of order.items) byRestaurant.set(i.restaurantName, [...(byRestaurant.get(i.restaurantName) ?? []), i]);

  return (
    <>
      <StatusPoller orderId={order.id} token={t ?? null} status={order.status} updatedAt={order.updatedAt.toISOString()} />
      {placed && order.status === "CONFIRMED" ? (
        <div role="status" className="mb-6 flex gap-3 rounded-[var(--radius-lg)] bg-ink p-5 text-on-dark">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-ink">
            <Check aria-hidden className="size-5" strokeWidth={3} />
          </span>
          <div>
            <p className="text-h3 font-bold">Thanks, {order.contactName.split(" ")[0]}. Your order is confirmed.</p>
            <p className="mt-1 text-small text-on-dark-muted">
              We’ve emailed your confirmation and this tracking link to {order.contactEmail}. Bookmark this page to check progress.
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-small text-muted">Order</p>
          <h1 className="text-h1 font-bold tabular tracking-[0.02em]">{order.number}</h1>
        </div>
        <OrderChip status={order.status} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-8">
          {terminalBad ? (
            <div className="flex gap-3 rounded-[var(--radius-lg)] border-2 border-ink p-5">
              {order.status === "CANCELLED" ? <CircleX aria-hidden className="size-6 shrink-0" /> : <UserX aria-hidden className="size-6 shrink-0" />}
              <div>
                <p className="text-h3 font-bold">{order.status === "CANCELLED" ? "This order was cancelled" : "This order wasn’t collected"}</p>
                <p className="mt-1 text-small text-muted">
                  {order.status === "CANCELLED"
                    ? `${order.cancelledBy === "CUSTOMER" ? "You cancelled it" : "We cancelled it"}${order.cancelledAt ? ` on ${formatLondonDateTime(order.cancelledAt)}` : ""}. Nothing is owed.`
                    : "Nobody came to the drop point during the delivery window. Contact us if you think this is wrong."}
                </p>
                {order.cancelReason && order.cancelledBy !== "CUSTOMER" ? <p className="mt-1 text-small">Reason: {order.cancelReason}</p> : null}
              </div>
            </div>
          ) : (
            <section aria-labelledby="progress-heading">
              <h2 id="progress-heading" className="sr-only">
                Progress
              </h2>
              <ol className="relative">
                {STEPS.map((s, i) => {
                  const done = i < currentIndex;
                  const current = i === currentIndex;
                  const at = stamps[s.status];
                  return (
                    <li key={s.status} className="relative flex gap-4 pb-7 last:pb-0" aria-current={current ? "step" : undefined}>
                      {i < STEPS.length - 1 ? (
                        <span aria-hidden className={cn("absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5", done ? "bg-ink" : "bg-border")} />
                      ) : null}
                      <span
                        aria-hidden
                        className={cn(
                          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                          done && "border-ink bg-ink text-on-dark",
                          current && "border-accent bg-accent text-on-accent ring-4 ring-accent-tint",
                          !done && !current && "border-border-strong bg-bg",
                        )}
                      >
                        {done || (current && s.status === "DELIVERED") ? <Check className="size-4" strokeWidth={3} /> : current ? <span className="size-2 rounded-full bg-on-accent" /> : null}
                      </span>
                      <div className="flex min-w-0 flex-1 justify-between gap-3 pt-1">
                        <div>
                          <p className={cn("font-bold", !done && !current && "text-muted")}>{s.label}</p>
                          {current ? <p className="text-small text-muted">{s.detail}</p> : null}
                        </div>
                        {at ? <p className="text-small text-muted tabular">{formatLondonTime(at)}</p> : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <section aria-labelledby="collect-heading" className="rounded-[var(--radius-lg)] bg-surface p-5">
            <h2 id="collect-heading" className="text-label font-bold uppercase tracking-[0.06em] text-muted">
              Collect from
            </h2>
            <p className="mt-2 flex items-start gap-2 text-h3 font-bold">
              <MapPin aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
              {dp.name}
            </p>
            <p className="mt-1 text-small">{dp.description}</p>
            {dp.directions ? <p className="mt-1 text-small text-muted">{dp.directions}</p> : null}
            {dp.mapUrl ? (
              <a href={dp.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-small font-bold underline underline-offset-4">
                Open in maps <ExternalLink aria-hidden className="size-3.5" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
            <p className="mt-4 border-t border-border pt-4 font-bold tabular">
              {occ.slot.name} · {day} · {window}
            </p>
          </section>

          <section aria-labelledby="items-heading">
            <h2 id="items-heading" className="text-h2 font-bold">
              Your order
            </h2>
            {[...byRestaurant.entries()].map(([name, items]) => (
              <div key={name} className="mt-4">
                <h3 className="border-b border-border pb-1.5 font-bold">{name}</h3>
                <ul className="divide-y divide-border">
                  {items.map((i) => (
                    <li key={i.id} className="py-3">
                      <div className="flex justify-between gap-3">
                        <p>
                          <span className="font-bold tabular">{i.quantity} ×</span> {i.name}
                        </p>
                        <p className="font-bold tabular">{formatPence(i.lineTotalPence)}</p>
                      </div>
                      <div className="mt-1">
                        <AllergenInfo allergens={i.allergens} mayContain={i.mayContain} noAllergens={i.noAllergens} compact />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <div className="rounded-[var(--radius-lg)] border border-border p-5">
            <OrderSummary subtotalPence={order.subtotalPence} fees={order.fees} totalPence={order.totalPence} totalLabel={order.paymentStatus === "COLLECTED" ? "Paid" : "Pay on delivery"} />
            {order.status !== "CANCELLED" ? (
              <p className="mt-4 flex gap-2 rounded-[var(--radius-sm)] bg-surface px-3 py-2 text-small">
                <Wallet aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  {order.paymentStatus === "COLLECTED" ? "Payment received. Thank you." : `Have ${formatPence(order.totalPence)} ready. ${settings.paymentInstructions}`}
                </span>
              </p>
            ) : null}
          </div>
          {canCancel ? <CancelOrderButton orderId={order.id} token={t ?? null} cutoff={formatLondonTime(occ.orderClosesAt)} /> : null}
          <p className="text-small text-muted">
            Problem with this order?{" "}
            <Link href={`/support?order=${order.id}${t ? `&t=${encodeURIComponent(t)}` : ""}`} className="font-bold text-ink underline underline-offset-4">
              Contact us
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}

export default function OrderPage(props: Props) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-lg)] bg-surface" />}>
        <OrderContent {...props} />
      </Suspense>
    </div>
  );
}
