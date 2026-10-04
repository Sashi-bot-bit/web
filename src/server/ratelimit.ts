import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";

/** Client IP as set by Vercel's edge (can't be forged through it). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

/**
 * Fixed-window limiter backed by Postgres (one atomic upsert per check).
 * Keys are hashed so no IPs or emails are stored in clear text.
 */
export async function rateLimit(name: string, subject: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `${name}:${createHash("sha256").update(subject).digest("hex").slice(0, 32)}`;
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart") VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimitBucket"."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE "RateLimitBucket"."windowStart" END
    RETURNING "count"`;
  return (rows[0]?.count ?? 1) <= limit;
}
