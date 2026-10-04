import { connection } from "next/server";
import { featuredOccurrence } from "@/shared/availability";
import { londonDate } from "@/shared/time";
import { getOccurrences } from "@/server/availability";
import { toSlotView } from "@/server/slot-view";
import { SlotHeroView } from "./slot-hero-view";

export async function SlotHero() {
  await connection();
  const now = new Date();
  const today = londonDate(now);
  const occurrences = await getOccurrences(now);
  const featured = featuredOccurrence(occurrences, now);
  const upcoming = occurrences
    .filter((o) => o.key !== featured?.key && o.orderClosesAt > now && o.status !== "CLOSED")
    .slice(0, 3)
    .map((o) => toSlotView(o, today));
  return <SlotHeroView featured={featured ? toSlotView(featured, today) : null} upcoming={upcoming} serverNow={now.toISOString()} />;
}

export function SlotHeroSkeleton() {
  return (
    <section aria-hidden className="bg-ink text-on-dark">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="h-4 w-32 animate-pulse rounded bg-white/15" />
        <div className="mt-3 h-12 w-64 animate-pulse rounded bg-white/15" />
        <div className="mt-4 h-4 w-72 animate-pulse rounded bg-white/10" />
      </div>
    </section>
  );
}
