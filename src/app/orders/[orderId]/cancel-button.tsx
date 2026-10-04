"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelOrderAction } from "@/server/actions/orders";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId, token, cutoff }: { orderId: string; token: string | null; cutoff: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {confirming ? (
        <div className="rounded-[var(--radius-md)] border border-border p-4">
          <p className="font-bold">Cancel this order?</p>
          <p className="mt-1 text-small text-muted">This can’t be undone. You can cancel until ordering closes at {cutoff}.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="danger"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await cancelOrderAction(orderId, token);
                  setMessage({ ok: result.ok, text: result.message });
                  setConfirming(false);
                  if (result.ok) router.refresh();
                })
              }
            >
              {pending ? "Cancelling…" : "Yes, cancel order"}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              Keep my order
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Cancel order
        </Button>
      )}
      <p role="status" aria-live="polite" className={`mt-2 text-small font-bold ${message?.ok ? "text-success-ink" : "text-danger-ink"}`}>
        {message?.text}
      </p>
    </div>
  );
}
