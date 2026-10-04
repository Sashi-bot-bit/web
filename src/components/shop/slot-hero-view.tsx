"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Clock, MapPin } from "lucide-react";
import type { SlotView } from "@/server/slot-view";
import { Countdown } from "./countdown";
import { SlotChip } from "./status-chips";

export function SlotHeroView({ featured, upcoming, serverNow }: { featured: SlotView | null; upcoming: SlotView[]; serverNow: string }) {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);
  const open = featured && (featured.status === "OPEN" || featured.status === "CLOSING_SOON");

  return (
    <section aria-labelledby="slot-heading" className="bg-ink text-on-dark">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {featured ? (
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="slot-heading" className="text-label font-bold uppercase tracking-[0.06em] text-accent-on-dark">
                  {featured.slotName} · {featured.day}
                </h2>
                <SlotChip status={featured.status} />
              </div>
              <div className="mt-4">
                {open ? (
                  <Countdown target={featured.orderClosesAt} serverNow={serverNow} label="Ordering closes in" onDone={refresh} />
                ) : (
                  <Countdown target={featured.orderOpensAt} serverNow={serverNow} label={`Ordering opens at ${featured.orderOpens} in`} onDone={refresh} />
                )}
              </div>
              <dl className="mt-6 grid max-w-xl grid-cols-2 gap-4 border-t border-white/15 pt-5">
                <div>
                  <dt className="flex items-center gap-1.5 text-small text-on-dark-muted">
                    <Clock aria-hidden className="size-4" /> Order window
                  </dt>
                  <dd className="mt-0.5 text-h3 font-bold tabular">
                    {featured.orderOpens}–{featured.orderCloses}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-small text-on-dark-muted">
                    <MapPin aria-hidden className="size-4" /> Delivered to your drop point
                  </dt>
                  <dd className="mt-0.5 text-h3 font-bold tabular">{featured.deliveryWindow}</dd>
                </div>
              </dl>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              {open ? (
                <Link
                  href="#restaurants"
                  className="inline-flex min-h-13 items-center justify-center rounded-[var(--radius-md)] bg-accent px-6 text-body font-bold text-on-accent hover:bg-accent-hover"
                >
                  Start your order
                </Link>
              ) : (
                <p className="max-w-xs text-small text-on-dark-muted md:text-right">You can build your basket now and check out when ordering opens.</p>
              )}
              {open && featured.spacesLeft <= 10 ? (
                <p className="text-small font-bold text-warn">Only {featured.spacesLeft} order{featured.spacesLeft === 1 ? "" : "s"} left in this slot</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div>
            <h2 id="slot-heading" className="text-h2 font-bold">
              We’re not taking orders right now
            </h2>
            <p className="mt-2 text-on-dark-muted">No delivery slots are open this week. Check back soon.</p>
          </div>
        )}

        {upcoming.length ? (
          <div className="mt-8 border-t border-white/15 pt-5">
            <h3 className="text-small font-bold text-on-dark-muted">Coming up</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {upcoming.map((s) => (
                <li key={s.key} className="rounded-[var(--radius-md)] bg-white/[0.06] px-3 py-2.5">
                  <p className="font-bold">
                    {s.slotName} · {s.day}
                  </p>
                  <p className="text-small text-on-dark-muted tabular">
                    Order {s.orderOpens}–{s.orderCloses} · Deliver {s.deliveryWindow}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
