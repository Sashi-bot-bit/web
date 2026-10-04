/** All money is integer pence. These helpers are the only place we touch pounds. */

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

export function formatPence(pence: number): string {
  if (!Number.isInteger(pence)) throw new Error("Money must be integer pence");
  return gbp.format(pence / 100);
}

/**
 * Parse a user-entered pounds amount ("8", "8.5", "£8.50") into pence.
 * Returns null for anything that is not a non-negative amount with ≤ 2 decimals.
 */
export function poundsToPence(input: string): number | null {
  const cleaned = input.trim().replace(/^£/, "").replace(/,/g, "");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** Pence → "8.50" for form inputs. */
export function penceToPoundsInput(pence: number): string {
  return (pence / 100).toFixed(2);
}
