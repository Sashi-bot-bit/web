import { z } from "zod";
import { ALLERGEN_CODES } from "../allergens";
import { poundsToPence } from "../money";
import { hhmmToMinutes, isDstSensitiveMinute, isLocalDate } from "../time";
import { slugify } from "../slug";
import { checkbox, id, optionalHttpsUrl, optionalImageUrl, optionalInt, optionalText, requiredInt, requiredText } from "./form";

const pounds = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .transform((v, ctx) => {
      const pence = poundsToPence(v);
      if (pence === null) {
        ctx.addIssue({ code: "custom", message: `${label} must be an amount like 8.50` });
        return z.NEVER;
      }
      return pence;
    });

const optionalPounds = (label: string) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), pounds(label).optional());

const slugField = z.preprocess(
  (v) => (typeof v === "string" ? slugify(v) : v),
  z.string().min(2, "Slug must be at least 2 characters").max(60),
);

// ───────── Restaurants / categories / dietary tags ─────────

export const restaurantInput = z
  .object({
    name: requiredText("Name", 80),
    slug: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), slugField.optional()),
    description: requiredText("Description", 400),
    logoUrl: optionalImageUrl,
    coverUrl: optionalImageUrl,
    isActive: checkbox,
  })
  .transform((v) => ({ ...v, slug: v.slug ?? slugify(v.name) }));
export type RestaurantInput = z.output<typeof restaurantInput>;

export const categoryInput = z.object({
  restaurantId: id,
  name: requiredText("Name", 60),
  isActive: checkbox,
});

export const dietaryTagInput = z
  .object({ label: requiredText("Label", 40), isActive: checkbox })
  .transform((v) => ({ ...v, slug: slugify(v.label) }));

// ───────── Menu items ─────────

const allergenList = z.array(z.enum(ALLERGEN_CODES, { error: "Unknown allergen" })).max(14);

export const menuItemInput = z
  .object({
    categoryId: id,
    name: requiredText("Name", 100),
    description: optionalText(1000).transform((v) => v ?? ""),
    price: pounds("Price"),
    discountedPrice: optionalPounds("Discounted price"),
    imageUrl: optionalImageUrl,
    isAvailable: checkbox,
    allergens: allergenList,
    mayContain: allergenList,
    containsNone: checkbox,
    allergensConfirmed: checkbox,
    dietaryTagIds: z.array(id).max(20),
    kcal: optionalInt("Calories", 0, 10000),
    spiceLevel: requiredInt("Spice level", 0, 3),
    portionNote: optionalText(80),
  })
  .superRefine((v, ctx) => {
    if (v.price <= 0) ctx.addIssue({ code: "custom", path: ["price"], message: "Price must be more than £0" });
    if (v.discountedPrice !== undefined && (v.discountedPrice <= 0 || v.discountedPrice >= v.price)) {
      ctx.addIssue({
        code: "custom",
        path: ["discountedPrice"],
        message: "Discounted price must be above £0 and below the full price",
      });
    }
    if (v.containsNone && v.allergens.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["allergens"],
        message: "Untick “Contains none of the 14 allergens” or clear the allergens",
      });
    }
    if (v.allergensConfirmed && !v.containsNone && v.allergens.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["allergens"],
        message: "Select the allergens this item contains, or tick “Contains none of the 14 allergens”",
      });
    }
    if (v.isAvailable && !v.allergensConfirmed) {
      ctx.addIssue({
        code: "custom",
        path: ["allergensConfirmed"],
        message: "Confirm the allergen information before making this item available",
      });
    }
  });
export type MenuItemInput = z.output<typeof menuItemInput>;

export const reorderInput = z.object({ ids: z.array(id).min(1).max(500) });

// ───────── Slots / closures ─────────

const clock = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .transform((v, ctx) => {
      const m = hhmmToMinutes(v);
      if (m === null) {
        ctx.addIssue({ code: "custom", message: `${label} must be a time like 11:30` });
        return z.NEVER;
      }
      if (isDstSensitiveMinute(m)) {
        ctx.addIssue({
          code: "custom",
          message: `${label} can't be between 01:00 and 02:59 (clocks change in that hour)`,
        });
        return z.NEVER;
      }
      return m;
    });

export const slotInput = z
  .object({
    name: requiredText("Name", 40),
    orderOpens: clock("Ordering opens"),
    orderCloses: clock("Ordering closes"),
    deliveryStarts: clock("Delivery starts"),
    deliveryEnds: clock("Delivery ends"),
    daysOfWeek: z
      .array(z.coerce.number().int().min(1).max(7))
      .min(1, "Pick at least one day")
      .transform((d) => [...new Set(d)].sort((a, b) => a - b)),
    capacity: requiredInt("Capacity", 0, 2000),
    closingSoonMinutes: requiredInt("Closing soon warning", 0, 120),
    isActive: checkbox,
  })
  .superRefine((v, ctx) => {
    if (v.orderOpens >= v.orderCloses) {
      ctx.addIssue({ code: "custom", path: ["orderCloses"], message: "Ordering must close after it opens" });
    }
    if (v.deliveryStarts < v.orderCloses) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryStarts"],
        message: "Delivery can't start before ordering closes",
      });
    }
    if (v.deliveryEnds <= v.deliveryStarts) {
      ctx.addIssue({ code: "custom", path: ["deliveryEnds"], message: "Delivery must end after it starts" });
    }
    if (v.closingSoonMinutes > v.orderCloses - v.orderOpens) {
      ctx.addIssue({
        code: "custom",
        path: ["closingSoonMinutes"],
        message: "Warning can't be longer than the ordering window",
      });
    }
  });
export type SlotInput = z.output<typeof slotInput>;

export const closureInput = z.object({
  localDate: z.string().refine(isLocalDate, "Enter a valid date"),
  reason: optionalText(120),
});

// ───────── Drop points / fees ─────────

export const dropPointInput = z.object({
  name: requiredText("Name", 60),
  description: requiredText("Description", 300),
  directions: optionalText(600),
  mapUrl: optionalHttpsUrl,
  isActive: checkbox,
});

export const feeInput = z
  .object({
    label: requiredText("Label", 40),
    type: z.enum(["FLAT", "PERCENT"], { error: "Choose a fee type" }),
    amount: z.string().optional(),
    percent: z.string().optional(),
    isActive: checkbox,
  })
  .transform((v, ctx) => {
    if (v.type === "FLAT") {
      const pence = poundsToPence(v.amount ?? "");
      if (pence === null) {
        ctx.addIssue({ code: "custom", path: ["amount"], message: "Amount must be like 1.50" });
        return z.NEVER;
      }
      return { label: v.label, type: v.type, amountPence: pence, basisPoints: null, isActive: v.isActive };
    }
    const raw = (v.percent ?? "").trim().replace(/%$/, "");
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(raw) || Number(raw) > 100) {
      ctx.addIssue({ code: "custom", path: ["percent"], message: "Percentage must be between 0 and 100, e.g. 7.5" });
      return z.NEVER;
    }
    const [whole, frac = ""] = raw.split(".");
    const basisPoints = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
    return { label: v.label, type: v.type, amountPence: null, basisPoints, isActive: v.isActive };
  });
export type FeeInput = z.output<typeof feeInput>;

// ───────── Settings ─────────

export const settingsInput = z.object({
  storeOpen: checkbox,
  brandName: requiredText("Brand name", 40),
  supportEmail: z.email({ error: "Enter a valid email address" }).max(254),
  paymentInstructions: requiredText("Payment instructions", 200),
  maxItemsPerOrder: requiredInt("Max items per order", 1, 200),
  maxQtyPerLine: requiredInt("Max quantity per item", 1, 99),
  maxActiveOrdersPerContactPerSlot: requiredInt("Orders per customer per slot", 1, 20),
  noShowBlockThreshold: requiredInt("No-show threshold", 1, 20),
  noShowWindowDays: requiredInt("No-show window", 7, 365),
  emailOnPreparing: checkbox,
  emailOnDelivered: checkbox,
});
