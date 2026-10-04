import type { FeeType } from "@/generated/prisma/enums";

export type PricedItem = { pricePence: number; discountedPricePence: number | null };
export type QuoteLine = { unitPricePence: number; quantity: number };
export type FeeRule = { id: string; label: string; type: FeeType; amountPence: number | null; basisPoints: number | null };
export type ChargedFee = FeeRule & { chargedPence: number };
export type Quote = { subtotalPence: number; fees: ChargedFee[]; feesPence: number; totalPence: number };

/** The price actually charged for one unit. */
export function unitPrice(item: PricedItem): number {
  return item.discountedPricePence ?? item.pricePence;
}

/** Round half up for non-negative integers expressed as numerator / denominator. */
function roundHalfUpDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2));
}

export function feeAmount(rule: FeeRule, subtotalPence: number): number {
  if (rule.type === "FLAT") {
    if (rule.amountPence == null || rule.amountPence < 0) throw new Error(`Invalid flat fee ${rule.id}`);
    return rule.amountPence;
  }
  if (rule.basisPoints == null || rule.basisPoints < 0) throw new Error(`Invalid percent fee ${rule.id}`);
  return roundHalfUpDiv(subtotalPence * rule.basisPoints, 10_000);
}

/** Pure quote. Fees are applied in the order given (callers pass them sorted). */
export function computeQuote(lines: readonly QuoteLine[], fees: readonly FeeRule[]): Quote {
  let subtotalPence = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error("Quantity must be a positive integer");
    if (!Number.isInteger(line.unitPricePence) || line.unitPricePence < 0) throw new Error("Price must be integer pence");
    subtotalPence += line.unitPricePence * line.quantity;
  }
  const charged = fees.map((f) => ({ ...f, chargedPence: feeAmount(f, subtotalPence) }));
  const feesPence = charged.reduce((sum, f) => sum + f.chargedPence, 0);
  return { subtotalPence, fees: charged, feesPence, totalPence: subtotalPence + feesPence };
}

/** "10.00%" style label for a basis-point value. */
export function formatBasisPoints(bp: number): string {
  return `${(bp / 100).toFixed(bp % 100 === 0 ? 0 : 2)}%`;
}
