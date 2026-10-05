"use client";

import Link from "next/link";
import { AlertTriangle, Minus, Plus, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { formatPence } from "@/shared/money";
import { cart, MAX_QTY_PER_LINE, useCart, useCartReady, type CartLine } from "@/lib/cart";
import { buttonClass } from "@/components/ui/button";
import { useQuote } from "@/components/shop/use-quote";
import { OrderSummary } from "@/components/shop/order-summary";

export function QuantityStepper({ line }: { line: CartLine }) {
  return (
    <div className="flex items-center rounded-full bg-surface" role="group" aria-label={`Quantity of ${line.name}`}>
      <button
        type="button"
        onClick={() => cart.setQuantity(line.menuItemId, line.quantity - 1)}
        className="flex size-11 items-center justify-center rounded-full hover:bg-surface-2"
      >
        {line.quantity === 1 ? <Trash2 aria-hidden className="size-4" /> : <Minus aria-hidden className="size-4" />}
        <span className="sr-only">{line.quantity === 1 ? `Remove ${line.name}` : `One fewer ${line.name}`}</span>
      </button>
      <span className="w-6 text-center font-semibold tabular">{line.quantity}</span>
      <button
        type="button"
        onClick={() => cart.setQuantity(line.menuItemId, line.quantity + 1)}
        disabled={line.quantity >= MAX_QTY_PER_LINE}
        className="flex size-11 items-center justify-center rounded-full text-accent-ink hover:bg-surface-2 disabled:opacity-30"
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
  const ready = useCartReady();

  if (!ready) return <div className="mt-6 h-48 animate-pulse rounded-[var(--radius-lg)] bg-surface" />;
  if (count === 0) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-[var(--radius-lg)] bg-bg px-6 py-14 text-center shadow-[var(--shadow-card)]">
        <span className="flex size-20 items-center justify-center rounded-full bg-accent-tint text-accent-ink">
          <ShoppingBag aria-hidden className="size-9" strokeWidth={1.75} />
        </span>
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
    <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-4">
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
          <section key={id} aria-labelledby={`r-${id}`} className="rounded-[var(--radius-lg)] bg-bg p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between gap-2 border-b border-border pb-3">
              <h2 id={`r-${id}`} className="text-h3 font-bold">
                {g.name}
              </h2>
              <Link href={`/r/${g.slug}`} className="inline-flex min-h-11 items-center gap-1 text-small font-semibold text-accent-ink hover:underline hover:underline-offset-4">
                <Plus aria-hidden className="size-4" /> Add more
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {g.lines.map((l) => {
                const quoted = quote?.lines.find((q) => q.menuItemId === l.menuItemId);
                return (
                  <li key={l.menuItemId} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-small text-muted tabular">
                        {formatPence(quoted?.unitPricePence ?? l.unitPricePence)} each
                        {quoted?.problem ? <span className="font-bold text-danger-ink"> · Unavailable</span> : null}
                      </p>
                    </div>
                    <QuantityStepper line={l} />
                    <p className="w-16 text-right font-semibold tabular">{formatPence((quoted?.unitPricePence ?? l.unitPricePence) * l.quantity)}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <aside aria-label="Basket total" className="lg:sticky lg:top-20">
        <div className="rounded-[var(--radius-lg)] bg-bg p-5 shadow-[var(--shadow-card)]">
          {quote ? <OrderSummary subtotalPence={quote.subtotalPence} fees={quote.fees} totalPence={quote.totalPence} /> : <div className="h-28 animate-pulse rounded bg-surface" />}
          {error ? <p className="mt-3 text-small font-bold text-danger-ink">We couldn’t check prices. Refresh the page to try again.</p> : null}
          <p className="mt-4 flex gap-2 rounded-[var(--radius-md)] bg-warn-tint px-3 py-2.5 text-small">
            <Wallet aria-hidden className="mt-0.5 size-4 shrink-0" />
            You pay when you collect. Choose your delivery slot and drop point at checkout.
          </p>
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
