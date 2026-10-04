"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { unitPrice } from "@/shared/fees";
import { profileInput } from "@/shared/validation/checkout";
import { auth } from "../auth";
import { ORDERABLE_ITEM } from "../catalog";
import { db } from "../db";
import { log } from "../log";
import { currentCustomer } from "../session";

type Result = { ok: boolean; message: string; errors?: Record<string, string[] | undefined> };

export async function updateProfileAction(raw: unknown): Promise<Result> {
  const customer = await currentCustomer();
  if (!customer) return { ok: false, message: "Sign in again to continue." };
  const parsed = profileInput.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Check the highlighted details.", errors: z.flattenError(parsed.error).fieldErrors };
  const before = await db.user.findUniqueOrThrow({ where: { id: customer.id }, select: { marketingOptIn: true } });
  await db.user.update({
    where: { id: customer.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      marketingOptIn: parsed.data.marketingOptIn,
      marketingOptInAt: parsed.data.marketingOptIn ? (before.marketingOptIn ? undefined : new Date()) : null,
    },
  });
  return { ok: true, message: "Your details are saved." };
}

export async function getFavouriteIdsAction(): Promise<{ signedIn: boolean; ids: string[] }> {
  const customer = await currentCustomer();
  if (!customer) return { signedIn: false, ids: [] };
  const favs = await db.favourite.findMany({ where: { userId: customer.id }, select: { menuItemId: true } });
  return { signedIn: true, ids: favs.map((f) => f.menuItemId) };
}

export async function toggleFavouriteAction(menuItemId: string): Promise<{ ok: boolean; favourite: boolean; message?: string }> {
  const customer = await currentCustomer();
  if (!customer) return { ok: false, favourite: false, message: "Sign in to save favourites." };
  const id = z.string().min(1).max(64).parse(menuItemId);
  const existing = await db.favourite.findUnique({ where: { userId_menuItemId: { userId: customer.id, menuItemId: id } } });
  if (existing) {
    await db.favourite.delete({ where: { userId_menuItemId: { userId: customer.id, menuItemId: id } } });
    return { ok: true, favourite: false };
  }
  const item = await db.menuItem.findFirst({ where: { id, archivedAt: null }, select: { id: true } });
  if (!item) return { ok: false, favourite: false, message: "This item is no longer on the menu." };
  await db.favourite.create({ data: { userId: customer.id, menuItemId: id } });
  return { ok: true, favourite: true };
}

export type ReorderLine = {
  menuItemId: string;
  name: string;
  unitPricePence: number;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
};

/** Lines from a past order that can still be ordered, at today's prices. */
export async function reorderAction(orderId: string): Promise<{ ok: boolean; lines: ReorderLine[]; notes: string[] }> {
  const customer = await currentCustomer();
  if (!customer) return { ok: false, lines: [], notes: ["Sign in again to continue."] };
  const order = await db.order.findFirst({ where: { id: String(orderId), userId: customer.id }, include: { items: true } });
  if (!order) return { ok: false, lines: [], notes: ["Order not found."] };

  const ids = order.items.map((i) => i.menuItemId).filter((v): v is string => Boolean(v));
  const live = await db.menuItem.findMany({
    where: { id: { in: ids }, ...ORDERABLE_ITEM },
    include: { restaurant: { select: { id: true, name: true, slug: true } } },
  });
  const byId = new Map(live.map((i) => [i.id, i]));
  const lines: ReorderLine[] = [];
  const notes: string[] = [];
  for (const old of order.items) {
    const item = old.menuItemId ? byId.get(old.menuItemId) : undefined;
    if (!item) {
      notes.push(`${old.name} is no longer available.`);
      continue;
    }
    const price = unitPrice(item);
    if (price !== old.unitPricePence) {
      notes.push(`${item.name} is now ${(price / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })} (was ${(old.unitPricePence / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })}).`);
    }
    lines.push({
      menuItemId: item.id,
      name: item.name,
      unitPricePence: price,
      quantity: old.quantity,
      restaurantId: item.restaurant.id,
      restaurantName: item.restaurant.name,
      restaurantSlug: item.restaurant.slug,
    });
  }
  return { ok: true, lines, notes };
}

/**
 * UK GDPR erasure. Personal data is removed or anonymised; order records are
 * kept without contact details for accounting. Refused while an order is in
 * progress, because we need to reach the customer at the drop point.
 */
export async function deleteAccountAction(confirmation: string): Promise<Result> {
  const customer = await currentCustomer();
  if (!customer) return { ok: false, message: "Sign in again to continue." };
  if (confirmation.trim().toUpperCase() !== "DELETE") return { ok: false, message: "Type DELETE to confirm." };
  const active = await db.order.count({
    where: { userId: customer.id, status: { in: ["CONFIRMED", "PREPARING", "IN_TRANSIT"] } },
  });
  if (active) {
    return { ok: false, message: "You have an order in progress. You can delete your account once it’s collected or cancelled." };
  }
  const anonEmail = `deleted-${customer.id}@deleted.invalid`;
  await db.$transaction([
    db.order.updateMany({
      where: { OR: [{ userId: customer.id }, { contactEmail: customer.email.toLowerCase() }] },
      data: { contactName: "Deleted customer", contactEmail: anonEmail, contactPhone: "+440000000000", marketingOptIn: false },
    }),
    db.supportTicket.updateMany({
      where: { OR: [{ userId: customer.id }, { contactEmail: customer.email.toLowerCase() }] },
      data: { contactName: "Deleted customer", contactEmail: anonEmail },
    }),
    db.favourite.deleteMany({ where: { userId: customer.id } }),
    db.session.deleteMany({ where: { userId: customer.id } }),
    db.account.deleteMany({ where: { userId: customer.id } }),
    db.user.update({
      where: { id: customer.id },
      data: { name: "Deleted customer", email: anonEmail, phone: null, image: null, marketingOptIn: false, marketingOptInAt: null, emailVerified: false, anonymisedAt: new Date() },
    }),
  ]);
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Sessions are already deleted above.
  }
  log.info("account_deleted", { userId: customer.id });
  return { ok: true, message: "Your account has been deleted." };
}
