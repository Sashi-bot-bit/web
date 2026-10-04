"use client";

import Link from "next/link";
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPence } from "@/shared/money";
import { cart, MAX_QTY_PER_LINE, useCart, type CartLine } from "@/lib/cart";
import { buttonClass } from "@/components/ui/button";
import { useQuote } from "@/components/shop/use-quote";
import { OrderSummary } from "@/components/shop/order-summary";

export function QuantityStepper({ line }: { line: CartLine }) {
  return (
    <div className="flex items-center rounded-full border border-border-strong" role="group" aria-label={`Quantity of ${line.name}`}>
      <button
        type="button"
        onClick={() => cart.setQuantity(line.menuItemId, line.quantity - 1)}
        className="flex size-11 items-center justify-center rounded-full hover:bg-surface"
      >
        {line.quantity === 1 ? <Trash2 aria-hidden className="size-4" /> : <Minus aria-hidden className="size-4" />}
        <span className="sr-only">{line.quantity === 1 ? `Remove ${line.name}` : `One fewer ${line.name}`}</span>
      </button>
      <span className="w-6 text-center font-bold tabular">{line.quantity}</span>
      <button
        type="button"
        onClick={() => cart.setQuantity(line.menuItemId, line.quantity + 1)}
        disabled={line.quantity >= MAX_QTY_PER_LINE}
        className="flex size-11 items-center justify-center rounded-full hover:bg-surface disabled:opacity-30"
      >
        <Plus aria-hidden className="size-4" />
        <span className="sr-only">One more {line.name}</span>
      </button>
    </div>
  );
}

export function CartView() {
  const { lines, count } = useCart();
  const { quote, error, pending } = useQuote(lines);

  if (count === 0) {
    return (
      <div className="mt-10 flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong px-6 py-14 text-center">
        <ShoppingBag aria-hidden className="size-10 text-muted" strokeWidth={1.5} />
        <p className="mt-4 text-h3 font-bold">Your basket is empty</p>
        <p className="mt-1 text-muted">Add something from one of our restaurants.</p>
        <Link href="/#restaurants" className={buttonClass("primary", "md", "mt-6")}>
          Browse restaurants
        </Link>
      </div>
    );
  }

  const groups = new Map<string, { name: string; slug: string; lines: CartLine[] }>();
  for (const l of lines) {
    const g = groups.get(l.restaurantId) ?? { name: l.restaurantName, slug: l.restaurantSlug, lines: [] };
    g.lines.push(l);
    groups.set(l.restaurantId, g);
  }
  const problems = quote?.problems ?? [];
  const canCheckout = Boolean(quote) && problems.length === 0 && !pending;

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="space-y-6">
        {problems.length ? (
          <div role="alert" className="rounded-[var(--radius-md)] border-l-4 border-danger bg-danger-tint p-4">
            <p className="flex items-center gap-2 font-bold text-danger-ink">
              <AlertTriangle aria-hidden className="size-5" /> Some items can’t be ordered right now
            </p>
            <ul className="mt-2 space-y-2">
              {problems.map((p) => (
                <li key={p.menuItemId} className="flex flex-wrap items-center justify-between gap-2 text-small">
                  <span>{p.name} is no longer available.</span>
                  <button type="button" onClick={() => cart.remove(p.menuItemId)} className="min-h-11 font-bold underline underline-offset-4">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {[...groups.entries()].map(([id, g]) => (
          <section key={id} aria-labelledby={`r-${id}`}>
            <div className="flex items-baseline justify-between gap-2 border-b border-border pb-2">
              <h2 id={`r-${id}`} className="text-h3 font-bold">
                {g.name}
              </h2>
              <Link href={`/r/${g.slug}`} className="text-small font-bold underline underline-offset-4">
                Add more
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {g.lines.map((l) => {
                const quoted = quote?.lines.find((q) => q.menuItemId === l.menuItemId);
                return (
                  <li key={l.menuItemId} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{l.name}</p>
                      <p className="text-small text-muted tabular">
                        {formatPence(quoted?.unitPricePence ?? l.unitPricePence)} each
                        {quoted?.problem ? <span className="font-bold text-danger-ink"> · Unavailable</span> : null}
                      </p>
                    </div>
                    <QuantityStepper line={l} />
                    <p className="w-16 text-right font-bold tabular">{formatPence((quoted?.unitPricePence ?? l.unitPricePence) * l.quantity)}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <aside aria-label="Basket total" className="lg:sticky lg:top-20">
        <div className="rounded-[var(--radius-lg)] border border-border p-5">
          {quote ? <OrderSummary subtotalPence={quote.subtotalPence} fees={quote.fees} totalPence={quote.totalPence} /> : <div className="h-28 animate-pulse rounded bg-surface" />}
          {error ? <p className="mt-3 text-small font-bold text-danger-ink">We couldn’t check prices. Refresh the page to try again.</p> : null}
          <p className="mt-3 text-small text-muted">You pay on delivery. Delivery slot and drop point are chosen at checkout.</p>
          <Link
            href={canCheckout ? "/checkout" : "#"}
            aria-disabled={!canCheckout}
            onClick={(e) => !canCheckout && e.preventDefault()}
            className={buttonClass("primary", "md", `mt-4 w-full min-h-13 ${canCheckout ? "" : "pointer-events-none opacity-50"}`)}
          >
            Go to checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}
