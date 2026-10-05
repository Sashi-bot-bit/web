import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { env } from "@/server/env";
import { log } from "@/server/log";

const TAG = /^(menu|slots|settings|drop-points|fees|restaurant:[a-z0-9]{1,40})$/;
const body = z.object({ tags: z.array(z.string().regex(TAG)).min(1).max(20) });

function authorised(header: string | null): boolean {
  if (!env.REVALIDATE_SECRET) return false;
  const expected = Buffer.from(`Bearer ${env.REVALIDATE_SECRET}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Called by the admin site after edits so customers see changes straight away. */
export async function POST(request: Request) {
  if (!authorised(request.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid tags" }, { status: 400 });
  // expire: 0 → the next request waits for fresh data (sold-out items must disappear quickly).
  for (const tag of parsed.data.tags) revalidateTag(tag, { expire: 0 });
  log.info("revalidated", { tags: parsed.data.tags });
  return Response.json({ revalidated: parsed.data.tags });
}
