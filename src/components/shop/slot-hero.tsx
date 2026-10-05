import { CalendarClock } from "lucide-react";
import { slotsNow } from "@/server/occurrences-now";
import { SlotCardView } from "./slot-hero-view";

/** Compact "ordering closes in…" card for the hero. */
export async function SlotCard() {
  const { now, featured } = await slotsNow();
  return <SlotCardView featured={featured} serverNow={now.toISOString()} />;
}

export function SlotCardSkeleton() {
  return <div aria-hidden className="h-[164px] w-full max-w-md animate-pulse rounded-[var(--radius-lg)] border border-border bg-bg" />;
}

/** Today's and upcoming delivery slots. */
export async function DeliveryTimes() {
  const { featured, upcoming } = await slotsNow();
  const all = [featured, ...upcoming].filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (!all.length) return <p className="text-muted">No delivery slots are open this week. Check back soon.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {all.map((s) => (
        <li key={s.key} className="rounded-[var(--radius-md)] border border-border bg-bg p-4">
          <p className="flex items-center gap-2 font-bold">
            <CalendarClock aria-hidden className="size-4 text-accent" />
            {s.slotName} · {s.day}
          </p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-small tabular">
            <dt className="text-muted">Order</dt>
            <dd>
              {s.orderOpens}–{s.orderCloses}
            </dd>
            <dt className="text-muted">Delivered</dt>
            <dd className="font-bold">{s.deliveryWindow}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
