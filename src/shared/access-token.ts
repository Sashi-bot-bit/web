import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Tokenised links for guests (order tracking, support threads). The token is an
 * HMAC of the record id with ORDER_LINK_SECRET, shared by the admin and web
 * apps, so either app can produce the link and nothing needs storing.
 * Rotating the secret invalidates every existing link.
 */
export type LinkKind = "order" | "ticket";

export function accessToken(secret: string, kind: LinkKind, id: string): string {
  if (secret.length < 32) throw new Error("ORDER_LINK_SECRET must be at least 32 characters");
  return createHmac("sha256", secret).update(`${kind}:${id}`).digest("base64url");
}

export function verifyAccessToken(secret: string, kind: LinkKind, id: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const expected = Buffer.from(accessToken(secret, kind, id));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Guest links work for this long after the record was created. */
export const LINK_LIFETIME_DAYS = 90;

export function linkStillValid(createdAt: Date, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() <= LINK_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
}
