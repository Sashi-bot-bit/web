/** Whether a poster should show right now (inclusive London-date window handled by the caller's UTC bounds). */
export function bannerLive(b: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }, now: Date): boolean {
  if (!b.isActive) return false;
  if (b.startsAt && now < b.startsAt) return false;
  if (b.endsAt && now >= b.endsAt) return false;
  return true;
}

export function isExternalLink(href: string): boolean {
  return /^https:\/\//.test(href);
}
