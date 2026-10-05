import type { Allergen } from "@/generated/prisma/enums";

/** UK FSA names for the 14 regulated allergens, in the FSA's usual order. */
export const ALLERGENS: ReadonlyArray<{ code: Allergen; label: string }> = [
  { code: "CELERY", label: "Celery" },
  { code: "GLUTEN", label: "Cereals containing gluten" },
  { code: "CRUSTACEANS", label: "Crustaceans" },
  { code: "EGGS", label: "Eggs" },
  { code: "FISH", label: "Fish" },
  { code: "LUPIN", label: "Lupin" },
  { code: "MILK", label: "Milk" },
  { code: "MOLLUSCS", label: "Molluscs" },
  { code: "MUSTARD", label: "Mustard" },
  { code: "TREE_NUTS", label: "Tree nuts" },
  { code: "PEANUTS", label: "Peanuts" },
  { code: "SESAME", label: "Sesame" },
  { code: "SOYA", label: "Soya" },
  { code: "SULPHITES", label: "Sulphur dioxide and sulphites" },
];

export const ALLERGEN_CODES = ALLERGENS.map((a) => a.code) as [Allergen, ...Allergen[]];

const labelByCode = new Map(ALLERGENS.map((a) => [a.code, a.label]));

export function allergenLabel(code: Allergen): string {
  return labelByCode.get(code) ?? code;
}

/** Sorted in FSA order, de-duplicated. */
export function normaliseAllergens(codes: readonly Allergen[]): Allergen[] {
  const set = new Set(codes);
  return ALLERGEN_CODES.filter((c) => set.has(c));
}

export const ALLERGENS_NOT_PROVIDED = "Allergen information not provided by the restaurant. Ask us before ordering if you have an allergy.";

/**
 * One-line allergen statement. Empty allergens only mean "none" when the item is
 * explicitly marked as containing none of the 14; otherwise the info is missing.
 */
export function allergenSummary(allergens: readonly Allergen[], noAllergens: boolean): string {
  if (allergens.length) return normaliseAllergens(allergens).map(allergenLabel).join(", ");
  return noAllergens ? "None of the 14 major allergens" : "Not provided by the restaurant";
}
