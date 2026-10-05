import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { isOrderableStatus } from "@/shared/availability";
import { londonDate } from "@/shared/time";
import { getOccurrences } from "@/server/availability";
import { getDropPoints, getSettings } from "@/server/catalog";
import { db } from "@/server/db";
import { currentCustomer } from "@/server/session";
import { toSlotView } from "@/server/slot-view";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function CheckoutData() {
  await connection();
  const now = new Date();
  const today = londonDate(now);
  const [occurrences, dropPoints, settings, customer] = await Promise.all([getOccurrences(now), getDropPoints(), getSettings(), currentCustomer()]);
  const profile = customer ? await db.user.findUnique({ where: { id: customer.id }, select: { phone: true, marketingOptIn: true } }) : null;
  const orderable = occurrences.filter((o) => isOrderableStatus(o.status)).map((o) => toSlotView(o, today));
  const next = occurrences.find((o) => o.status === "UPCOMING" && o.orderOpensAt > now);

  return (
    <CheckoutForm
      slots={orderable}
      nextOpening={next ? toSlotView(next, today) : null}
      dropPoints={dropPoints}
      paymentInstructions={settings.paymentInstructions}
      storeOpen={settings.storeOpen}
      customer={customer ? { name: customer.name, email: customer.email, phone: profile?.phone ?? "", marketingOptIn: profile?.marketingOptIn ?? false } : null}
    />
  );
}

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <h1 className="text-h1 font-bold">Checkout</h1>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-[var(--radius-lg)] bg-surface" />}>
        <CheckoutData />
      </Suspense>
    </div>
  );
}
