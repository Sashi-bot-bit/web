import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// "use cache" helpers only work inside Next; in tests they are no-ops.
vi.mock("next/cache", () => ({ cacheLife: () => undefined, cacheTag: () => undefined }));

const { db } = await import("@/server/db");
const { placeOrder, PlaceOrderError } = await import("@/server/orders/place");

// A fixed instant: Tuesday 12 Jan 2027, 11:30 London (GMT) — inside an 11:00–12:00 window.
const NOW = new Date("2027-01-12T11:30:00Z");
const DATE = "2027-01-12";
const tag = randomUUID().slice(0, 8);

let restaurantA: string;
let restaurantB: string;
let itemA: string;
let itemB: string;
let unavailable: string;
let dropPoint: string;
let slotId: string;
let capSlotId: string;
let feeId: string;

function input(overrides: Partial<Parameters<typeof placeOrder>[0]> = {}) {
  return {
    lines: [{ menuItemId: itemA, quantity: 2 }],
    slotId,
    localDate: DATE,
    dropPointId: dropPoint,
    name: "Test Customer",
    email: `c-${randomUUID()}@example.test`,
    phone: `+4477009${String(Math.floor(Math.random() * 1e5)).padStart(5, "0")}`,
    termsAccepted: true as const,
    marketingOptIn: false,
    // 2 × £5.00 + £1.50 flat fee
    expectedTotalPence: 1150,
    ...overrides,
  };
}

async function code(p: Promise<unknown>) {
  try {
    await p;
    return "OK";
  } catch (e) {
    if (e instanceof PlaceOrderError) return e.code;
    throw e;
  }
}

beforeAll(async () => {
  await db.settings.upsert({
    where: { id: 1 },
    update: { storeOpen: true, maxActiveOrdersPerContactPerSlot: 2 },
    create: { id: 1, brandName: "Test", supportEmail: "s@example.test", paymentInstructions: "Pay on collection." },
  });
  // Other tests' fees must not affect totals here.
  await db.fee.updateMany({ data: { isActive: false } });
  feeId = (await db.fee.create({ data: { label: `Delivery ${tag}`, type: "FLAT", amountPence: 150, sortOrder: 0 } })).id;

  const mk = async (name: string) => {
    const r = await db.restaurant.create({ data: { slug: `${name}-${tag}`, name: `${name} ${tag}`, description: "Test", sortOrder: 99 } });
    const c = await db.category.create({ data: { restaurantId: r.id, name: "Mains", sortOrder: 0 } });
    return { r, c };
  };
  const a = await mk("alpha");
  const b = await mk("beta");
  restaurantA = a.r.id;
  restaurantB = b.r.id;
  const item = (restaurantId: string, categoryId: string, name: string, ok = true) =>
    db.menuItem.create({
      data: {
        restaurantId,
        categoryId,
        name,
        description: "",
        pricePence: 500,
        sortOrder: 0,
        allergens: ["GLUTEN"],
        isAvailable: ok,
      },
    });
  itemA = (await item(a.r.id, a.c.id, "A")).id;
  itemB = (await item(b.r.id, b.c.id, "B")).id;
  unavailable = (await item(a.r.id, a.c.id, "Off", false)).id;
  dropPoint = (await db.dropPoint.create({ data: { name: `DP ${tag}`, description: "Test", sortOrder: 0 } })).id;
  const slot = (capacity: number) =>
    db.slot.create({
      data: { name: `Lunch ${tag}`, orderOpensMin: 660, orderClosesMin: 720, deliveryStartsMin: 765, deliveryEndsMin: 795, daysOfWeek: [2], capacity, sortOrder: 0 },
    });
  slotId = (await slot(10)).id;
  capSlotId = (await slot(50)).id;
  await db.slotRestaurantCap.create({ data: { slotId: capSlotId, restaurantId: restaurantB, maxOrders: 1 } });
});

afterAll(async () => {
  const occ = await db.slotOccurrence.findMany({ where: { slotId: { in: [slotId, capSlotId] } }, select: { id: true } });
  await db.order.deleteMany({ where: { slotOccurrenceId: { in: occ.map((o) => o.id) } } });
  await db.slotOccurrence.deleteMany({ where: { slotId: { in: [slotId, capSlotId] } } });
  await db.slot.deleteMany({ where: { id: { in: [slotId, capSlotId] } } });
  await db.menuItem.deleteMany({ where: { restaurantId: { in: [restaurantA, restaurantB] } } });
  await db.category.deleteMany({ where: { restaurantId: { in: [restaurantA, restaurantB] } } });
  await db.restaurant.deleteMany({ where: { id: { in: [restaurantA, restaurantB] } } });
  await db.dropPoint.delete({ where: { id: dropPoint } });
  await db.fee.delete({ where: { id: feeId } });
  await db.contactBlock.deleteMany({ where: { value: { contains: tag } } });
  await db.$disconnect();
});

describe("placeOrder", () => {
  it("never oversells: 25 concurrent checkouts for 10 places → exactly 10 orders", async () => {
    const results = await Promise.all(Array.from({ length: 25 }, () => code(placeOrder(input(), null, NOW))));
    expect(results.filter((r) => r === "OK")).toHaveLength(10);
    expect(results.filter((r) => r !== "OK").every((r) => r === "SLOT_FULL")).toBe(true);
    const occ = await db.slotOccurrence.findUniqueOrThrow({ where: { slotId_localDate: { slotId, localDate: new Date(`${DATE}T00:00:00Z`) } } });
    expect(await db.order.count({ where: { slotOccurrenceId: occ.id } })).toBe(10);
  });

  it("frees capacity when an order is cancelled", async () => {
    const occ = await db.slotOccurrence.findUniqueOrThrow({ where: { slotId_localDate: { slotId, localDate: new Date(`${DATE}T00:00:00Z`) } } });
    const one = await db.order.findFirstOrThrow({ where: { slotOccurrenceId: occ.id } });
    await db.order.update({ where: { id: one.id }, data: { status: "CANCELLED" } });
    expect(await code(placeOrder(input(), null, NOW))).toBe("OK");
    expect(await code(placeOrder(input(), null, NOW))).toBe("SLOT_FULL");
  });

  it("computes totals on the server and snapshots items, allergens and fees", async () => {
    const placed = await placeOrder(input({ slotId: capSlotId }), null, NOW);
    const order = await db.order.findUniqueOrThrow({ where: { id: placed.id }, include: { items: true, fees: true } });
    expect(order.subtotalPence).toBe(1000);
    expect(order.feesPence).toBe(150);
    expect(order.totalPence).toBe(1150);
    expect(order.items[0]).toMatchObject({ unitPricePence: 500, quantity: 2, allergens: ["GLUTEN"] });
    expect(order.fees.map((f) => f.chargedPence)).toEqual([150]);
    expect(order.status).toBe("CONFIRMED");
  });

  it("refuses when the price changed since the customer saw it", async () => {
    expect(await code(placeOrder(input({ slotId: capSlotId, expectedTotalPence: 999 }), null, NOW))).toBe("PRICE_CHANGED");
  });

  it("refuses unavailable items", async () => {
    expect(await code(placeOrder(input({ slotId: capSlotId, lines: [{ menuItemId: unavailable, quantity: 1 }], expectedTotalPence: 0 }), null, NOW))).toBe(
      "ITEMS_UNAVAILABLE",
    );
  });

  it("enforces per-restaurant caps", async () => {
    const lines = [{ menuItemId: itemB, quantity: 1 }];
    expect(await code(placeOrder(input({ slotId: capSlotId, lines, expectedTotalPence: 650 }), null, NOW))).toBe("OK");
    expect(await code(placeOrder(input({ slotId: capSlotId, lines, expectedTotalPence: 650 }), null, NOW))).toBe("RESTAURANT_FULL");
  });

  it("limits active orders per contact per slot", async () => {
    const email = `same-${randomUUID()}@example.test`;
    expect(await code(placeOrder(input({ slotId: capSlotId, email }), null, NOW))).toBe("OK");
    expect(await code(placeOrder(input({ slotId: capSlotId, email }), null, NOW))).toBe("OK");
    expect(await code(placeOrder(input({ slotId: capSlotId, email }), null, NOW))).toBe("CONTACT_LIMIT");
  });

  it("refuses blocked contacts", async () => {
    const email = `blocked-${tag}@example.test`;
    await db.contactBlock.create({ data: { kind: "EMAIL", value: email, reason: "test", source: "ADMIN" } });
    expect(await code(placeOrder(input({ slotId: capSlotId, email }), null, NOW))).toBe("CONTACT_BLOCKED");
  });

  it("refuses after the cutoff and before opening", async () => {
    expect(await code(placeOrder(input({ slotId: capSlotId }), null, new Date("2027-01-12T12:00:00Z")))).toBe("SLOT_CLOSED");
    expect(await code(placeOrder(input({ slotId: capSlotId }), null, new Date("2027-01-12T10:59:00Z")))).toBe("SLOT_CLOSED");
  });

  it("refuses a day the slot doesn't run", async () => {
    expect(await code(placeOrder(input({ slotId: capSlotId, localDate: "2027-01-13" }), null, NOW))).toBe("SLOT_UNAVAILABLE");
  });
});
