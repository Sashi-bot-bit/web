import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

import { E2E_DB } from "./db-url";

/** Resets the dedicated e2e database and seeds a restaurant with a slot that is open now. */
export async function resetAndSeed() {
  if (!new URL(E2E_DB).pathname.includes("e2e")) throw new Error("Refusing to reset a database whose name doesn't contain 'e2e'");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: E2E_DB }) });
  try {
    const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);

    await db.settings.create({ data: { id: 1, brandName: "Campus Eats", supportEmail: "help@e2e.test", paymentInstructions: "Pay by cash or card at the drop point." } });
    const r = await db.restaurant.create({ data: { slug: "e2e-burgers", name: "E2E Burgers", description: "Test restaurant.", sortOrder: 0 } });
    const c = await db.category.create({ data: { restaurantId: r.id, name: "Burgers", sortOrder: 0 } });
    await db.menuItem.create({
      data: { restaurantId: r.id, categoryId: c.id, name: "Test Burger", description: "A test burger.", pricePence: 850, sortOrder: 0, allergens: ["GLUTEN", "MILK"], allergensConfirmedAt: new Date(), isAvailable: true },
    });
    await db.menuItem.create({
      data: { restaurantId: r.id, categoryId: c.id, name: "Test Fries", description: "", pricePence: 300, sortOrder: 1, allergens: [], allergensConfirmedAt: new Date(), isAvailable: true },
    });
    await db.fee.create({ data: { label: "Delivery fee", type: "FLAT", amountPence: 150, sortOrder: 0 } });
    await db.dropPoint.create({ data: { name: "Library steps", description: "Front steps of the library.", sortOrder: 0 } });

    // A slot whose ordering window contains "now" in London.
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const nowMin = Number(parts.find((p) => p.type === "hour")!.value) * 60 + Number(parts.find((p) => p.type === "minute")!.value);
    if (nowMin >= 1430) throw new Error("E2E tests need at least 10 minutes before midnight (London) to create an open slot");
    const opens = Math.max(0, nowMin - 30);
    const closes = Math.min(1434, nowMin + 90);
    await db.slot.create({
      data: { name: "E2E Lunch", orderOpensMin: opens, orderClosesMin: closes, deliveryStartsMin: closes, deliveryEndsMin: Math.min(1440, closes + 5), daysOfWeek: [1, 2, 3, 4, 5, 6, 7], capacity: 50, sortOrder: 0 },
    });
  } finally {
    await db.$disconnect();
  }
}

// Run directly: `tsx e2e/fixtures.ts`
resetAndSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
