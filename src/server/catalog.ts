import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { dbDateToLocalDate, localDateToDbDate, londonDate } from "@/shared/time";
import { db } from "./db";

/**
 * Cached catalogue reads. The admin site invalidates these tags through
 * /api/revalidate; the 60 s revalidate is a backstop if that call fails.
 */
const MENU_LIFE = { stale: 30, revalidate: 60, expire: 3600 };

/** An item can be ordered only when it and its category and restaurant are live. */
export const ORDERABLE_ITEM = {
  archivedAt: null,
  isAvailable: true,
  category: { isActive: true, archivedAt: null },
  restaurant: { isActive: true, archivedAt: null },
} as const;

export async function getRestaurants() {
  "use cache";
  cacheLife(MENU_LIFE);
  cacheTag("menu");
  const rows = await db.restaurant.findMany({
    where: { isActive: true, archivedAt: null },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      coverUrl: true,
      logoUrl: true,
      categories: { where: { isActive: true, archivedAt: null }, orderBy: { sortOrder: "asc" }, select: { name: true } },
      _count: { select: { items: { where: ORDERABLE_ITEM } } },
    },
  });
  return rows.map(({ _count, categories, ...r }) => ({ ...r, categories: categories.map((c) => c.name), orderableItems: _count.items }));
}

export type MenuItemView = {
  id: string;
  name: string;
  description: string;
  pricePence: number;
  discountedPricePence: number | null;
  imageUrl: string | null;
  orderable: boolean;
  allergens: string[];
  mayContain: string[];
  noAllergens: boolean;
  dietary: { slug: string; label: string }[];
  kcal: number | null;
  spiceLevel: number;
  portionNote: string | null;
};

export async function getRestaurantMenu(slug: string) {
  "use cache";
  cacheLife(MENU_LIFE);
  cacheTag("menu");
  const restaurant = await db.restaurant.findFirst({
    where: { slug, isActive: true, archivedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      coverUrl: true,
      logoUrl: true,
      categories: {
        where: { isActive: true, archivedAt: null },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          items: {
            where: { archivedAt: null },
            orderBy: { sortOrder: "asc" },
            include: { dietaryTags: { include: { dietaryTag: true } } },
          },
        },
      },
    },
  });
  if (!restaurant) return null;
  cacheTag(`restaurant:${restaurant.id}`);
  return {
    ...restaurant,
    categories: restaurant.categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        items: c.items.map(
          (i): MenuItemView => ({
            id: i.id,
            name: i.name,
            description: i.description,
            pricePence: i.pricePence,
            discountedPricePence: i.discountedPricePence,
            imageUrl: i.imageUrl,
            orderable: i.isAvailable,
            allergens: i.allergens,
            mayContain: i.mayContain,
            noAllergens: i.noAllergens,
            dietary: i.dietaryTags
              .filter((t) => t.dietaryTag.isActive)
              .sort((a, b) => a.dietaryTag.sortOrder - b.dietaryTag.sortOrder)
              .map((t) => ({ slug: t.dietaryTag.slug, label: t.dietaryTag.label })),
            kcal: i.kcal,
            spiceLevel: i.spiceLevel,
            portionNote: i.portionNote,
          }),
        ),
      }))
      .filter((c) => c.items.length > 0),
  };
}

export async function getSettings() {
  "use cache";
  cacheLife(MENU_LIFE);
  cacheTag("settings");
  const s = await db.settings.findUnique({ where: { id: 1 } });
  return {
    brandName: s?.brandName ?? process.env.NEXT_PUBLIC_BRAND_NAME ?? "Campus Eats",
    supportEmail: s?.supportEmail ?? null,
    storeOpen: s?.storeOpen ?? false,
    paymentInstructions: s?.paymentInstructions ?? "Pay when you collect your order.",
    maxItemsPerOrder: s?.maxItemsPerOrder ?? 30,
    maxQtyPerLine: s?.maxQtyPerLine ?? 10,
    maxActiveOrdersPerContactPerSlot: s?.maxActiveOrdersPerContactPerSlot ?? 2,
    noShowBlockThreshold: s?.noShowBlockThreshold ?? 2,
    noShowWindowDays: s?.noShowWindowDays ?? 90,
    emailOnPreparing: s?.emailOnPreparing ?? false,
    emailOnDelivered: s?.emailOnDelivered ?? false,
    legalName: s?.legalName ?? null,
    legalAddress: s?.legalAddress ?? null,
    companyNumber: s?.companyNumber ?? null,
  };
}

export async function getDropPoints() {
  "use cache";
  cacheLife(MENU_LIFE);
  cacheTag("drop-points");
  return db.dropPoint.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, description: true, directions: true, mapUrl: true },
  });
}

export async function getActiveFees() {
  "use cache";
  cacheLife(MENU_LIFE);
  cacheTag("fees");
  return db.fee.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, type: true, amountPence: true, basisPoints: true },
  });
}

/** Slot templates + caps + upcoming closures. `today` is part of the cache key. */
export async function getSlotConfig(today: string) {
  "use cache";
  cacheLife(MENU_LIFE);
  cacheTag("slots");
  const [slots, closures] = await Promise.all([
    db.slot.findMany({ where: { isActive: true }, include: { restaurantCaps: true }, orderBy: { orderOpensMin: "asc" } }),
    db.closureDate.findMany({ where: { localDate: { gte: localDateToDbDate(today) } }, select: { localDate: true } }),
  ]);
  return {
    slots: slots.map(({ restaurantCaps, ...s }) => ({
      ...s,
      restaurantCaps: Object.fromEntries(restaurantCaps.map((c) => [c.restaurantId, c.maxOrders])),
    })),
    closures: closures.map((c) => dbDateToLocalDate(c.localDate)),
  };
}

export function todayInLondon() {
  return londonDate(new Date());
}
