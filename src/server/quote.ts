import "server-only";
import type { Allergen } from "@/generated/prisma/enums";
import { computeQuote, unitPrice, type Quote } from "@/shared/fees";
import type { CartLineInput } from "@/shared/validation/checkout";
import { getActiveFees } from "./catalog";
import { db } from "./db";

export type QuoteProblem = "NOT_FOUND" | "UNAVAILABLE";

export type QuotedLine = {
  menuItemId: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  unitPricePence: number;
  originalUnitPricePence: number;
  quantity: number;
  lineTotalPence: number;
  allergens: Allergen[];
  mayContain: Allergen[];
  noAllergens: boolean;
  dietaryLabels: string[];
  kcal: number | null;
  problem: QuoteProblem | null;
};

export type CartQuote = Quote & { lines: QuotedLine[]; problems: { menuItemId: string; name: string; problem: QuoteProblem }[] };

/**
 * Authoritative pricing from the database. Client prices are never used.
 * Lines with problems are reported and excluded from the totals.
 */
export async function quoteCart(input: CartLineInput[]): Promise<CartQuote> {
  const merged = new Map<string, number>();
  for (const l of input) merged.set(l.menuItemId, (merged.get(l.menuItemId) ?? 0) + l.quantity);

  const [items, fees] = await Promise.all([
    db.menuItem.findMany({
      where: { id: { in: [...merged.keys()] } },
      include: {
        restaurant: { select: { id: true, name: true, slug: true, isActive: true, archivedAt: true } },
        category: { select: { isActive: true, archivedAt: true } },
        dietaryTags: { include: { dietaryTag: { select: { label: true, isActive: true } } } },
      },
    }),
    getActiveFees(),
  ]);
  const byId = new Map(items.map((i) => [i.id, i]));

  const lines: QuotedLine[] = [];
  const problems: CartQuote["problems"] = [];
  for (const [menuItemId, quantity] of merged) {
    const i = byId.get(menuItemId);
    if (!i) {
      problems.push({ menuItemId, name: "An item", problem: "NOT_FOUND" });
      continue;
    }
    const orderable =
      !i.archivedAt &&
      i.isAvailable &&
      i.restaurant.isActive &&
      !i.restaurant.archivedAt &&
      i.category.isActive &&
      !i.category.archivedAt;
    const unit = unitPrice(i);
    const problem: QuoteProblem | null = orderable ? null : "UNAVAILABLE";
    if (problem) problems.push({ menuItemId, name: i.name, problem });
    lines.push({
      menuItemId,
      name: i.name,
      restaurantId: i.restaurant.id,
      restaurantName: i.restaurant.name,
      restaurantSlug: i.restaurant.slug,
      unitPricePence: unit,
      originalUnitPricePence: i.pricePence,
      quantity,
      lineTotalPence: unit * quantity,
      allergens: i.allergens,
      mayContain: i.mayContain,
      noAllergens: i.noAllergens,
      dietaryLabels: i.dietaryTags.filter((t) => t.dietaryTag.isActive).map((t) => t.dietaryTag.label),
      kcal: i.kcal,
      problem,
    });
  }

  const priced = lines.filter((l) => !l.problem);
  const quote = computeQuote(
    priced.map((l) => ({ unitPricePence: l.unitPricePence, quantity: l.quantity })),
    priced.length ? fees : [],
  );
  return { ...quote, lines, problems };
}
