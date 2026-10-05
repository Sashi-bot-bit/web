"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function CartButton() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-surface"
      aria-label={count ? `Basket, ${count} item${count === 1 ? "" : "s"}` : "Basket, empty"}
    >
      <ShoppingBag aria-hidden className="size-5" strokeWidth={1.75} />
      {count ? (
        <span aria-hidden className="absolute top-1 right-0.5 min-w-5 rounded-full bg-attention px-1 text-center text-[0.6875rem] leading-5 font-bold text-ink tabular">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
