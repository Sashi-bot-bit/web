import { z } from "zod";
import { normaliseEmail, normaliseUkMobile } from "../contact";
import { isLocalDate } from "../time";

const id = z.string().min(1).max(64);

export const cartLineInput = z.object({
  menuItemId: id,
  quantity: z.number().int().min(1).max(99),
});
export type CartLineInput = z.infer<typeof cartLineInput>;

export const cartInput = z.array(cartLineInput).min(1, "Your basket is empty").max(50);

export const contactName = z.string().trim().min(1, "Enter your name").max(80, "Use 80 characters or fewer");
export const contactEmail = z
  .email({ error: "Enter a valid email address, like name@example.com" })
  .max(254)
  .transform(normaliseEmail);
export const ukMobile = z.string().transform((v, ctx) => {
  const e164 = normaliseUkMobile(v);
  if (!e164) {
    ctx.addIssue({ code: "custom", message: "Enter a UK mobile number, like 07700 900123" });
    return z.NEVER;
  }
  return e164;
});

export const placeOrderInput = z.object({
  lines: cartInput,
  slotId: id,
  localDate: z.string().refine(isLocalDate, "Choose a delivery slot"),
  dropPointId: id.or(z.literal("")).refine((v) => v !== "", "Choose a drop point"),
  name: contactName,
  email: contactEmail,
  phone: ukMobile,
  termsAccepted: z.literal(true, { error: "Accept the terms to place your order" }),
  marketingOptIn: z.boolean(),
  /** Total the customer saw; the order is refused if the server total differs. */
  expectedTotalPence: z.number().int().min(0),
});
export type PlaceOrderInput = z.infer<typeof placeOrderInput>;

export const profileInput = z.object({
  name: contactName,
  phone: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), ukMobile.optional()),
  marketingOptIn: z.boolean(),
});

export const ticketInput = z.object({
  subject: z.string().trim().min(3, "Add a short subject").max(120),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(4000),
  orderId: z.preprocess((v) => (v === "" ? undefined : v), id.optional()),
  name: contactName,
  email: contactEmail,
});

export const ticketReplyInput = z.object({
  message: z.string().trim().min(1, "Write a reply").max(4000),
});

export const cancelReasonInput = z.object({
  reason: z.string().trim().min(3, "Give a short reason").max(300),
});
