/** Contact normalisation shared by checkout, anti-abuse blocks and admin search. */

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Normalise a UK mobile number to E.164 (+447xxxxxxxxx).
 * Accepts "07700 900123", "+44 7700 900123", "447700900123", "(0)7700-900123".
 * Returns null if it is not a UK mobile.
 */
export function normaliseUkMobile(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("0044")) digits = digits.slice(2);
  if (digits.startsWith("440")) digits = "44" + digits.slice(3);
  if (digits.startsWith("07")) digits = "44" + digits.slice(1);
  if (!/^447\d{9}$/.test(digits)) return null;
  return `+${digits}`;
}

/** +447700900123 → 07700 900123 */
export function formatUkMobile(e164: string): string {
  const national = "0" + e164.replace(/^\+44/, "");
  return `${national.slice(0, 5)} ${national.slice(5)}`;
}
