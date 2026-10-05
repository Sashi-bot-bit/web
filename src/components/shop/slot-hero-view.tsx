"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Clock } from "lucide-react";
import type { SlotView } from "@/server/slot-view";
import { Countdown } from "./countdown";
import { SlotChip } from "./status-chips";

/** "Today's orders close in" card (mockup style) with live HH:MM:SS. */
export function SlotCardView({ featured, serverNow }: { featured: SlotView | null; serverNow: string }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  if (!featured) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-warn-tint p-5">
        <p className="font-semibold">We’re not taking orders this week</p>
        <p className="mt-1 text-small text-ink-2">Check back soon for the next delivery slot.</p>
      </div>
    );
  }
  const open = featured.status === "OPEN" || featured.status === "CLOSING_SOON";
  const heading = open ? `${featured.day === "Today" ? "Today’s" : featured.day} ${featured.slotName.toLowerCase()} orders close in` : `${featured.slotName} ordering opens in`;
  return (
    <section aria-labelledby="slot-card-heading" className="rounded-[var(--radius-lg)] bg-warn-tint p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warn text-ink">
          <Clock className="size-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="slot-card-heading" className="font-semibold">
              {heading}
            </h2>
            <SlotChip status={featured.status} />
          </div>
          <div className="mt-3">
            <Countdown
              target={open ? featured.orderClosesAt : featured.orderOpensAt}
              serverNow={serverNow}
              label={open ? "Ordering closes in" : `Ordering opens at ${featured.orderOpens}, in`}
              onDone={refresh}
            />
          </div>
          <p className="mt-3 text-small text-ink-2">
            {open ? (
              <>
                Order by <span className="font-semibold tabular">{featured.orderCloses}</span> · collect <span className="font-semibold tabular">{featured.deliveryWindow}</span>
              </>
            ) : (
              <>
                {featured.day} · order <span className="font-semibold tabular">{featured.orderOpens}–{featured.orderCloses}</span> · collect{" "}
                <span className="font-semibold tabular">{featured.deliveryWindow}</span>
              </>
            )}
          </p>
          {open && featured.spacesLeft <= 10 ? <p className="mt-1 text-small font-semibold text-danger-ink">Only {featured.spacesLeft} orders left in this slot</p> : null}
        </div>
      </div>
    </section>
  );
}
