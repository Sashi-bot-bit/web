"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { reorderAction } from "@/server/actions/account";
import { cart } from "@/lib/cart";

export function ReorderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await reorderAction(orderId);
            if (!result.ok || result.lines.length === 0) {
              setNotes(result.notes.length ? result.notes : ["None of these items can be ordered right now."]);
              return;
            }
            for (const { quantity, ...line } of result.lines) cart.add(line, quantity);
            if (result.notes.length) {
              setNotes([...result.notes, "The rest has been added to your basket."]);
              return;
            }
            router.push("/cart");
          })
        }
        className="inline-flex min-h-11 items-center gap-2 text-small font-bold underline-offset-4 hover:underline disabled:opacity-50"
      >
        <RotateCcw aria-hidden className="size-4" /> {pending ? "Adding…" : "Order again"}
      </button>
      <div role="status" aria-live="polite">
        {notes.length ? (
          <ul className="pb-2 text-small text-muted">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
