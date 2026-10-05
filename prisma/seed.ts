/**
 * Seed: admin user (from env), Settings and the default dietary tags always.
 * Starter catalogue (real Hatfield restaurants), slots, drop points and fees only when the database has no
 * restaurants yet and SEED_CATALOGUE is not "false", so re-running the seed never
 * overwrites the operator's edits.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import { PrismaClient, type Allergen } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL! }) });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to seed`);
  return value;
}

async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.info("ADMIN_EMAIL / ADMIN_PASSWORD not set: admin login not created or updated.");
    return;
  }
  const email = requireEnv("ADMIN_EMAIL").trim().toLowerCase();
  const password = requireEnv("ADMIN_PASSWORD");
  if (password.length < 16) throw new Error("ADMIN_PASSWORD must be at least 16 characters");
  const name = process.env.ADMIN_NAME ?? "Operator";
  const hash = await hashPassword(password);

  const existing = await db.user.findUnique({ where: { email } });
  const user = existing
    ? await db.user.update({ where: { email }, data: { role: "ADMIN", name, emailVerified: true } })
    : await db.user.create({ data: { id: randomUUID(), email, name, role: "ADMIN", emailVerified: true } });

  const account = await db.account.findFirst({ where: { userId: user.id, providerId: "credential" } });
  if (account) {
    await db.account.update({ where: { id: account.id }, data: { password: hash } });
  } else {
    await db.account.create({
      data: { id: randomUUID(), userId: user.id, accountId: user.id, providerId: "credential", password: hash },
    });
  }
  console.info(`Admin user ready (${existing ? "updated" : "created"}).`);
}

async function seedSettings() {
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      brandName: process.env.NEXT_PUBLIC_BRAND_NAME ?? "Campus Eats",
      supportEmail: process.env.SUPPORT_EMAIL ?? "support@campus-eats.test",
      paymentInstructions: "Pay by cash or card when you collect your order at the drop point.",
    },
  });
}

type SeedItem = {
  name: string;
  description: string;
  price: number;
  discounted?: number;
  /** Pre-filled from the restaurant's published allergen information, if any. Admin must still confirm. */
  allergens: Allergen[];
  mayContain?: Allergen[];
  tags?: string[];
  kcal?: number;
  spice?: number;
  portion?: string;
};
type SeedRestaurant = {
  slug: string;
  name: string;
  description: string;
  categories: { name: string; items: SeedItem[] }[];
};

/*
 * Real restaurants near the College Lane campus (researched October 2026).
 *  - Favorite Chicken & Ribs, 38 The Common, AL10 0LU: items from favorite.co.uk/our-menu, allergens from
 *    favorite.co.uk "Online menu – allergens February 2026", prices from public listings for the Hatfield store.
 *  - Spice Field, 3 High View, AL10 8HZ: items and prices from spicefieldherts.co.uk/hatfield/menus.
 *    No allergen information is published, so allergens are blank until the restaurant provides them.
 *  - Pizza GoGo Hatfield, 31 Market Place, AL10 0LJ: prices from public listings for the Hatfield store.
 *    Pizza GoGo withdrew its allergen document for review in July 2026, so allergens are blank.
 * Every item starts unconfirmed and unavailable: the operator must check prices and allergens with each
 * restaurant, tick the confirmation, then switch the item on. Restaurant photos are not included (copyright);
 * upload images the restaurant has supplied or approved.
 */
const FAV_MEAL_NOTE = "Includes regular fries and a can of drink.";
const RESTAURANTS: SeedRestaurant[] = [
  {
    slug: "favorite-chicken-hatfield",
    name: "Favorite Chicken & Ribs",
    description: "Fried chicken, burgers, wings and wraps. 38 The Common, Hatfield.",
    categories: [
      {
        name: "Chicken Meals",
        items: [
          { name: "Favorite Chicken Meal", description: `Pieces of Favorite’s traditional southern fried chicken. ${FAV_MEAL_NOTE}`, price: 799, allergens: ["CELERY", "GLUTEN", "MILK"], mayContain: ["EGGS", "FISH", "MUSTARD", "SOYA", "SULPHITES"] },
          { name: "Favorite Wings Meal", description: `Spicy crunchy wings. ${FAV_MEAL_NOTE}`, price: 899, allergens: ["GLUTEN"], mayContain: ["CELERY", "MILK", "MUSTARD", "SOYA"], spice: 2 },
          { name: "Fillet Strips Meal", description: `Crispy chicken fillet strips. ${FAV_MEAL_NOTE}`, price: 999, allergens: ["GLUTEN"] },
          { name: "Boneless Sampler Meal", description: `A mix of fillet strips, poppas and wings. ${FAV_MEAL_NOTE}`, price: 1099, allergens: ["CELERY", "EGGS", "GLUTEN", "MILK"], mayContain: ["FISH", "MUSTARD", "SOYA", "SULPHITES"] },
        ],
      },
      {
        name: "Burger & Wrap Meals",
        items: [
          { name: "Fillet Burger Meal", description: `Chicken fillet burger. ${FAV_MEAL_NOTE}`, price: 949, allergens: ["CELERY", "EGGS", "GLUTEN", "MILK", "MUSTARD", "SESAME"], mayContain: ["FISH", "SOYA", "SULPHITES"] },
          { name: "Fillet of Fire Burger Meal", description: `Spicy chicken fillet burger. ${FAV_MEAL_NOTE}`, price: 949, allergens: ["EGGS", "GLUTEN", "MUSTARD", "SESAME"], mayContain: ["CELERY", "MILK", "SOYA"], spice: 2 },
          { name: "Double Ringer Plus Meal", description: `Double chicken fillet burger with extras. ${FAV_MEAL_NOTE}`, price: 1299, allergens: ["CELERY", "EGGS", "GLUTEN", "MILK", "MUSTARD", "SESAME", "SULPHITES"], mayContain: ["FISH", "SOYA"] },
          { name: "Rappa Meal", description: `Chicken wrap. ${FAV_MEAL_NOTE}`, price: 949, allergens: ["EGGS", "GLUTEN", "MUSTARD"] },
        ],
      },
      {
        name: "Sharing",
        items: [
          { name: "Chicken & Fries to Share", description: "A sharing box of Favorite chicken pieces with fries.", price: 1999, allergens: ["CELERY", "GLUTEN", "MILK"], mayContain: ["EGGS", "FISH", "MUSTARD", "SOYA", "SULPHITES"], portion: "Serves 2–3" },
        ],
      },
    ],
  },
  {
    slug: "spice-field-hatfield",
    name: "Spice Field",
    description: "Indian curries, biryanis, tandoori and fresh naan. 3 High View, Hatfield.",
    categories: [
      {
        name: "Curries & Biryanis",
        items: [
          { name: "Chicken Tikka Masala", description: "Chicken tikka cooked with fresh cream and yoghurt sauce.", price: 999, allergens: [], spice: 1 },
          { name: "Butter Chicken", description: "Cooked in a specially blended sauce with cream and almond.", price: 999, allergens: [], spice: 1 },
          { name: "Chicken Biryani", description: "Stir fried with basmati rice and served with vegetable curry.", price: 899, allergens: [], spice: 2 },
          { name: "Lamb Biryani", description: "Stir fried with basmati rice and served with vegetable curry.", price: 899, allergens: [], spice: 2 },
          { name: "Chicken Tikka Biryani", description: "Chicken tikka stir fried with basmati rice, served with vegetable curry.", price: 999, allergens: [], spice: 2 },
        ],
      },
      {
        name: "Starters & Wraps",
        items: [
          { name: "Onion Bhaji", description: "Crisp spiced onion fritters.", price: 399, allergens: [], tags: ["vegetarian"], portion: "3 pieces", spice: 1 },
          { name: "Vegetable Samosa", description: "Spiced vegetable samosas.", price: 399, allergens: [], tags: ["vegetarian"], portion: "3 pieces", spice: 1 },
          { name: "Chicken Tikka Starter", description: "Tender chicken tikka grilled on charcoal.", price: 499, allergens: [], spice: 1 },
          { name: "Chicken Wrap Meal", description: "Chicken wrap with chips and a can of drink.", price: 699, allergens: [] },
          { name: "Chicken Sheek Kebab Roll Meal", description: "Chicken sheek kebab roll with chips, can of drink, salad and sauce.", price: 699, allergens: [], spice: 1 },
        ],
      },
      {
        name: "Rice, Naan & Drinks",
        items: [
          { name: "Pilau Rice", description: "Fragrant basmati pilau rice.", price: 399, allergens: [], tags: ["vegetarian"] },
          { name: "Naan", description: "Fresh naan bread from the tandoor.", price: 299, allergens: [], tags: ["vegetarian"] },
          { name: "Garlic Naan", description: "Naan bread with garlic.", price: 399, allergens: [], tags: ["vegetarian"] },
          { name: "Peshwari Naan", description: "Naan filled with coconut and sultanas.", price: 399, allergens: [], tags: ["vegetarian"] },
          { name: "Coke Can", description: "330ml can.", price: 150, allergens: [], tags: ["vegan", "gluten-free"], portion: "330ml" },
          { name: "Water Bottle", description: "Still water.", price: 100, allergens: [], tags: ["vegan", "gluten-free"], portion: "500ml" },
        ],
      },
    ],
  },
  {
    slug: "pizza-gogo-hatfield",
    name: "Pizza GoGo",
    description: "Freshly made pizza, garlic bread and sides. 31 Market Place, Hatfield.",
    categories: [
      {
        name: "Classic Pizzas",
        items: [
          { name: "Margherita (Medium)", description: "Tomato sauce and mozzarella.", price: 799, allergens: [], tags: ["vegetarian"], portion: "Medium" },
          { name: "Margherita (Large)", description: "Tomato sauce and mozzarella.", price: 999, allergens: [], tags: ["vegetarian"], portion: "Large" },
        ],
      },
      {
        name: "Meat Pizzas",
        items: [
          { name: "Pepperoni Feast (Medium)", description: "Loaded with pepperoni and mozzarella.", price: 899, allergens: [], portion: "Medium" },
          { name: "Pepperoni Feast (Large)", description: "Loaded with pepperoni and mozzarella.", price: 1099, allergens: [], portion: "Large" },
        ],
      },
      {
        name: "Sides",
        items: [
          { name: "Garlic Bread", description: "Oven-baked garlic bread.", price: 249, allergens: [], tags: ["vegetarian"] },
          { name: "Cheesy Garlic Bread", description: "Garlic bread topped with melted cheese.", price: 349, allergens: [], tags: ["vegetarian"] },
        ],
      },
    ],
  },
];

const DIETARY_TAGS = [
  { slug: "vegetarian", label: "Vegetarian" },
  { slug: "vegan", label: "Vegan" },
  { slug: "halal", label: "Halal" },
  { slug: "gluten-free", label: "Gluten-free" },
];

async function seedDietaryTags() {
  const tagIds = new Map<string, string>();
  for (const [i, t] of DIETARY_TAGS.entries()) {
    const tag = await db.dietaryTag.upsert({
      where: { slug: t.slug },
      update: {},
      create: { slug: t.slug, label: t.label, sortOrder: i },
    });
    tagIds.set(t.slug, tag.id);
  }
  return tagIds;
}

async function seedCatalogue(tagIds: Map<string, string>) {
  if (process.env.SEED_CATALOGUE === "false") {
    console.info("SEED_CATALOGUE=false: starter catalogue skipped.");
    return;
  }
  if ((await db.restaurant.count()) > 0) {
    console.info("Restaurants already exist: starter catalogue skipped.");
    return;
  }

  const restaurantIds = new Map<string, string>();
  for (const [ri, r] of RESTAURANTS.entries()) {
    const restaurant = await db.restaurant.create({
      data: { slug: r.slug, name: r.name, description: r.description, sortOrder: ri },
    });
    restaurantIds.set(r.slug, restaurant.id);
    for (const [ci, c] of r.categories.entries()) {
      const category = await db.category.create({
        data: { restaurantId: restaurant.id, name: c.name, sortOrder: ci },
      });
      for (const [ii, item] of c.items.entries()) {
        await db.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            categoryId: category.id,
            name: item.name,
            description: item.description,
            pricePence: item.price,
            discountedPricePence: item.discounted ?? null,
            sortOrder: ii,
            allergens: item.allergens,
            mayContain: item.mayContain ?? [],
            // Unconfirmed until the operator checks with the restaurant (see note above RESTAURANTS).
            allergensConfirmedAt: null,
            allergensConfirmedBy: null,
            isAvailable: false,
            kcal: item.kcal ?? null,
            spiceLevel: item.spice ?? 0,
            portionNote: item.portion ?? null,
            dietaryTags: {
              create: (item.tags ?? []).map((slug) => ({ dietaryTagId: tagIds.get(slug)! })),
            },
          },
        });
      }
    }
  }

  const lunch = await db.slot.create({
    data: {
      name: "Lunch",
      orderOpensMin: 11 * 60,
      orderClosesMin: 12 * 60,
      deliveryStartsMin: 12 * 60 + 45,
      deliveryEndsMin: 13 * 60 + 15,
      daysOfWeek: [1, 2, 3, 4, 5],
      capacity: 60,
      closingSoonMinutes: 15,
      sortOrder: 0,
    },
  });
  await db.slotRestaurantCap.create({
    data: { slotId: lunch.id, restaurantId: restaurantIds.get("spice-field-hatfield")!, maxOrders: 0 }, // opens 5pm: dinner only
  });
  await db.slot.create({
    data: {
      name: "Dinner",
      orderOpensMin: 16 * 60 + 30,
      orderClosesMin: 17 * 60 + 30,
      deliveryStartsMin: 18 * 60 + 30,
      deliveryEndsMin: 19 * 60,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      capacity: 40,
      closingSoonMinutes: 15,
      sortOrder: 1,
    },
  });

  await db.dropPoint.createMany({
    data: [
      {
        name: "Bus interchange shelter",
        description: "Covered shelter at the main bus interchange.",
        directions: "Look for the violet flag by the first shelter. Bring your order number.",
        sortOrder: 0,
      },
      {
        name: "Residences courtyard",
        description: "Benches in the central courtyard of the student residences.",
        directions: "Wait by the bike racks next to the courtyard entrance.",
        sortOrder: 1,
      },
    ],
  });

  await db.fee.createMany({
    data: [
      { label: "Delivery fee", type: "FLAT", amountPence: 150, sortOrder: 0 },
      { label: "Service fee", type: "PERCENT", basisPoints: 500, sortOrder: 1 },
    ],
  });

  console.info("Catalogue seeded: 3 Hatfield restaurants (items unconfirmed and off until checked), 2 slots, 2 drop points, 2 fees.");
}

async function main() {
  await seedAdmin();
  await seedSettings();
  await seedCatalogue(await seedDietaryTags());
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await db.$disconnect();
    process.exit(1);
  });
