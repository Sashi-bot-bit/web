/**
 * Placeholder food photography (Unsplash License: free for commercial use, no
 * attribution required) used until a restaurant has its own photos. Images are
 * generic cuisine shots, not the restaurants' dishes. An uploaded cover or item
 * photo in admin always takes precedence.
 */
const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

export const FOOD_PHOTOS = {
  chicken: { src: U("photo-1637710847214-f91d99669e18"), alt: "A crispy fried chicken burger" },
  burger: { src: U("photo-1551782450-a2132b4ba21d"), alt: "A burger with fries" },
  curry: { src: U("photo-1565557623262-b51c2513a641"), alt: "Chicken curry with naan bread" },
  pizza: { src: U("photo-1534308983496-4fabb1a015ee"), alt: "A pepperoni pizza in a box" },
} as const;

export type Cuisine = keyof typeof FOOD_PHOTOS;

const RULES: [Cuisine, RegExp][] = [
  ["pizza", /pizza/i],
  ["curry", /curry|biryani|naan|tandoor|indian|masala|balti/i],
  ["chicken", /chicken|wings|fried|ribs/i],
  ["burger", /burger|grill|smash/i],
];

/** Best-matching cuisine for a restaurant from its name, description and categories. */
export function cuisineOf(text: string): Cuisine {
  return RULES.find(([, re]) => re.test(text))?.[0] ?? "burger";
}

export function coverFor(r: { coverUrl: string | null; name: string; description: string; categories?: string[] }) {
  if (r.coverUrl) return { src: r.coverUrl, alt: "" };
  const photo = FOOD_PHOTOS[cuisineOf([r.name, r.description, ...(r.categories ?? [])].join(" "))];
  return { src: photo.src, alt: photo.alt };
}
