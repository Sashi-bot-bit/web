import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Receipt } from "lucide-react";
import { formatPence } from "@/shared/money";
import { dbDateToLocalDate, formatLocalDate } from "@/shared/time";
import { db } from "@/server/db";
import { orderPath } from "@/server/links";
import { requireCustomerPage } from "@/server/require-customer";
import { buttonClass } from "@/components/ui/button";
import { OrderChip } from "@/components/shop/status-chips";
import { ReorderButton } from "./reorder-button";

export const metadata: Metadata = { title: "Your orders", robots: { index: false } };

export default async function OrdersPage() {
  const customer = await requireCustomerPage("/account/orders");
  const orders = await db.order.findMany({
    where: { userId: customer.id },
    orderBy: { placedAt: "desc" },
    take: 50,
    include: {
      items: { select: { name: true, quantity: true, restaurantName: true } },
      slotOccurrence: { select: { localDate: true, slot: { select: { name: true } } } },
    },
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong px-6 py-14 text-center">
        <Receipt aria-hidden className="size-10 text-muted" strokeWidth={1.5} />
        <p className="mt-4 text-h3 font-bold">No orders yet</p>
        <p className="mt-1 max-w-sm text-muted">
          {customer.emailVerified ? "Your orders will appear here." : "Confirm your email to see orders you placed as a guest."}
        </p>
        <Link href="/#restaurants" className={buttonClass("primary", "md", "mt-6")}>
          Start an order
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => {
        const restaurants = [...new Set(o.items.map((i) => i.restaurantName))];
        const itemCount = o.items.reduce((n, i) => n + i.quantity, 0);
        return (
          <li key={o.id} className="rounded-[var(--radius-md)] border border-border">
            <Link href={orderPath(o.id)} className="flex items-start gap-3 p-4 hover:bg-surface">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold tabular">{o.number}</span>
                  <OrderChip status={o.status} />
                </div>
                <p className="mt-1 text-small">
                  {o.slotOccurrence.slot.name} · {formatLocalDate(dbDateToLocalDate(o.slotOccurrence.localDate))}
                </p>
                <p className="mt-0.5 truncate text-small text-muted">
                  {itemCount} item{itemCount === 1 ? "" : "s"} from {restaurants.join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold tabular">{formatPence(o.totalPence)}</span>
                <ChevronRight aria-hidden className="size-4 text-muted" />
              </div>
            </Link>
            <div className="border-t border-border px-4 py-2">
              <ReorderButton orderId={o.id} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
