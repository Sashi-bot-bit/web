"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toggleFavouriteAction } from "@/server/actions/account";
import { cart, type CartLine } from "@/lib/cart";

export function FavouriteActions({ item, orderable }: { item: Omit<CartLine, "quantity">; orderable: boolean }) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-1">
      {orderable ? (
        <button
          type="button"
          onClick={() => {
            cart.add(item, 1);
            setAdded(true);
          }}
          className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] px-3 text-small font-bold hover:bg-surface"
        >
          <Plus aria-hidden className="size-4" /> {added ? "Added" : "Add"}
          <span className="sr-only"> {item.name} to basket</span>
        </button>
      ) : null}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await toggleFavouriteAction(item.menuItemId);
            router.refresh();
          })
        }
        className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-3 text-small font-bold text-muted hover:bg-surface hover:text-ink"
      >
        Remove<span className="sr-only"> {item.name} from favourites</span>
      </button>
    </div>
  );
}
