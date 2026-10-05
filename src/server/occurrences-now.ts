import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { featuredOccurrence } from "@/shared/availability";
import { londonDate } from "@/shared/time";
import { getOccurrences } from "./availability";
import { toSlotView } from "./slot-view";

/** Live slot data for this request, shared by every component that needs it. */
export const slotsNow = cache(async () => {
  await connection();
  const now = new Date();
  const today = londonDate(now);
  const occurrences = await getOccurrences(now);
  const featured = featuredOccurrence(occurrences, now);
  const upcoming = occurrences
    .filter((o) => o.key !== featured?.key && o.orderClosesAt > now && o.status !== "CLOSED")
    .slice(0, 3)
    .map((o) => toSlotView(o, today));
  return { now, featured: featured ? toSlotView(featured, today) : null, upcoming };
});
