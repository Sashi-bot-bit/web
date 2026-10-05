"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPence } from "@/shared/money";
import { useCart } from "@/lib/cart";

/** Sticky basket bar in the thumb zone on mobile. Hidden on the basket and checkout pages. */
export function CartBar() {
  const { count, subtotalPence } = useCart();
  const pathname = usePathname();
  const hidden = !count || pathname.startsWith("/cart") || pathname.startsWith("/checkout") || pathname.startsWith("/orders");
  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {count ? `Basket: ${count} item${count === 1 ? "" : "s"}, ${formatPence(subtotalPence)}` : ""}
      </div>
      {hidden ? null : (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <Link
            href="/cart"
            className="flex min-h-14 items-center justify-between rounded-full bg-accent pr-5 pl-2 text-on-accent shadow-[var(--shadow-float)] hover:bg-accent-hover"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-bg font-bold text-accent-ink tabular">{count}</span>
              <span className="font-semibold">View basket</span>
            </span>
            <span className="font-semibold tabular">{formatPence(subtotalPence)}</span>
          </Link>
        </div>
      )}
    </>
  );
}
