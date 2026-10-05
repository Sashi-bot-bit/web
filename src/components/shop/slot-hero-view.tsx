"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Bike } from "lucide-react";
import type { SlotView } from "@/server/slot-view";
import { Countdown } from "./countdown";
import { SlotChip } from "./status-chips";

export function SlotCardView({ featured, serverNow }: { featured: SlotView | null; serverNow: string }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  if (!featured) {
    return (
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-bg p-5 shadow-[var(--shadow-float)]">
        <p className="font-bold">We’re not taking orders this week</p>
        <p className="mt-1 text-small text-muted">Check back soon for the next delivery slot.</p>
      </div>
    );
  }
  const open = featured.status === "OPEN" || featured.status === "CLOSING_SOON";
  return (
    <section aria-labelledby="slot-card-heading" className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-bg p-5 shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between gap-3">
        <h2 id="slot-card-heading" className="font-bold">
          {featured.slotName} · {featured.day}
        </h2>
        <SlotChip status={featured.status} />
      </div>
      <div className="mt-3">
        {open ? (
          <Countdown target={featured.orderClosesAt} serverNow={serverNow} label="Ordering closes in" onDone={refresh} />
        ) : (
          <Countdown target={featured.orderOpensAt} serverNow={serverNow} label={`Ordering opens at ${featured.orderOpens}, in`} onDone={refresh} />
        )}
      </div>
      <p className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-small">
        <Bike aria-hidden className="size-4 shrink-0 text-accent" />
        <span>
          Order {featured.orderOpens}–{featured.orderCloses} · <span className="font-bold tabular">Delivered {featured.deliveryWindow}</span>
        </span>
      </p>
      {open && featured.spacesLeft <= 10 ? (
        <p className="mt-2 text-small font-bold text-danger-ink">Only {featured.spacesLeft} order{featured.spacesLeft === 1 ? "" : "s"} left in this slot</p>
      ) : null}
      {!open ? <p className="mt-2 text-small text-muted">Build your basket now and check out when ordering opens.</p> : null}
    </section>
  );
}
