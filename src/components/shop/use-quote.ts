"use client";

import { useEffect, useState, useTransition } from "react";
import { quoteCartAction } from "@/server/actions/checkout";
import type { CartQuote } from "@/server/quote";
import { cart, type CartLine } from "@/lib/cart";

/** Server quote for the current basket; refreshes whenever lines change. */
export function useQuote(lines: CartLine[]) {
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const key = lines.map((l) => `${l.menuItemId}:${l.quantity}`).join(",");

  useEffect(() => {
    if (!key) return;
    const payload = key.split(",").map((p) => {
      const [menuItemId, q] = p.split(":");
      return { menuItemId, quantity: Number(q) };
    });
    startTransition(async () => {
      const q = await quoteCartAction(payload);
      if (!q) {
        setError(true);
        return;
      }
      setError(false);
      setQuote(q);
      cart.sync(q.lines.map((l) => ({ menuItemId: l.menuItemId, name: l.name, unitPricePence: l.unitPricePence })));
    });
  }, [key]);

  return { quote: key ? quote : null, setQuote, error, pending };
}
