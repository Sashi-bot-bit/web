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
