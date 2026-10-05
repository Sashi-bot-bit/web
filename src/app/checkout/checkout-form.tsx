"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, Check, Clock, MapPin, Timer, Wallet } from "lucide-react";
import { restaurantOpenIn } from "@/shared/availability";
import { allergenLabel, allergenSummary } from "@/shared/allergens";
import { formatPence } from "@/shared/money";
import type { Allergen } from "@/generated/prisma/enums";
import type { SlotView } from "@/server/slot-view";
import { placeOrderAction } from "@/server/actions/checkout";
import { cart, useCart, useCartReady } from "@/lib/cart";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Checkbox, FieldError, TextField } from "@/components/ui/field";
import { OrderSummary } from "@/components/shop/order-summary";
import { useQuote } from "@/components/shop/use-quote";

type DropPoint = { id: string; name: string; description: string; directions: string | null; mapUrl: string | null };
type Customer = { name: string; email: string; phone: string; marketingOptIn: boolean } | null;
type Errors = Record<string, string[] | undefined>;

function Step({ n, title, children, done }: { n: number; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <section aria-labelledby={`step-${n}`} className="rounded-[var(--radius-lg)] bg-bg p-4 shadow-[var(--shadow-card)] sm:p-5">
      <h2 id={`step-${n}`} className="flex items-center gap-3 text-h3 font-bold">
        <span
          aria-hidden
          className={cn("flex size-8 items-center justify-center rounded-full text-small tabular", done ? "bg-accent text-on-accent" : "bg-accent-tint text-accent-ink")}
        >
          {done ? <Check className="size-4" /> : n}
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function CheckoutForm({
  slots,
  nextOpening,
  dropPoints,
  paymentInstructions,
  storeOpen,
  customer,
}: {
  slots: SlotView[];
  nextOpening: SlotView | null;
  dropPoints: DropPoint[];
  paymentInstructions: string;
  storeOpen: boolean;
  customer: Customer;
}) {
  const router = useRouter();
  const { lines, count } = useCart();
  const ready = useCartReady();
  const { quote, setQuote, pending: quoting } = useQuote(lines);
  const restaurantIds = useMemo(() => [...new Set(lines.map((l) => l.restaurantId))], [lines]);

  const slotUsable = (s: SlotView) => restaurantIds.every((r) => restaurantOpenIn(s, r));
  const firstUsable = slots.find(slotUsable);
  const [slotKey, setSlotKey] = useState(firstUsable?.key ?? "");
  const [dropPointId, setDropPointId] = useState(dropPoints.length === 1 ? dropPoints[0].id : "");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const placedRef = useRef(false);

  useEffect(() => {
    if (ready && count === 0 && !placedRef.current) router.replace("/cart");
  }, [ready, count, router]);

  const slot = slots.find((s) => s.key === slotKey);
  const dropPoint = dropPoints.find((d) => d.id === dropPointId);
  const problems = quote?.problems ?? [];

  function focusProblem() {
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]") ?? document.getElementById("checkout-message");
      el?.focus();
    });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!quote || !slot) {
      setErrors({ slot: ["Choose a delivery slot"] });
      focusProblem();
      return;
    }
    const fd = new FormData(e.currentTarget);
    const payload = {
      lines: lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
      slotId: slot.slotId,
      localDate: slot.localDate,
      dropPointId,
      name: String(fd.get("name") ?? ""),
      email: customer?.email ?? String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      termsAccepted: fd.get("terms") === "on",
      marketingOptIn: fd.get("marketing") === "on",
      expectedTotalPence: quote.totalPence,
    };
    setMessage(null);
    startPlacing(async () => {
      const result = await placeOrderAction(payload);
      if (result.ok) {
        placedRef.current = true;
        cart.clear();
        router.push(result.path);
        return;
      }
      const fe = result.fieldErrors ?? {};
      setErrors({ ...fe, slot: fe.localDate ?? fe.slotId, terms: fe.termsAccepted });
      if (result.quote) setQuote(result.quote);
      setMessage(result.message);
      if (result.code === "SLOT_CLOSED" || result.code === "SLOT_FULL") router.refresh();
      focusProblem();
    });
  }

  if (!storeOpen || slots.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-[var(--radius-lg)] bg-warn-tint px-6 py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-warn text-ink">
          <Clock aria-hidden className="size-8" strokeWidth={2} />
        </span>
        <p className="mt-4 text-h3 font-bold">Ordering is closed right now</p>
        <p className="mt-2 max-w-sm text-ink-2">
          {nextOpening
            ? `${nextOpening.slotName} ordering opens ${nextOpening.day.toLowerCase()} at ${nextOpening.orderOpens}. Your basket is saved on this device.`
            : "There are no delivery slots open this week. Your basket is saved on this device."}
        </p>
        <Link href="/" className={buttonClass("primary", "md", "mt-6 min-h-12 px-7")}>
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="space-y-4">
        <Step n={1} title="Delivery slot" done={Boolean(slot)}>
          <fieldset aria-describedby={errors.slot ? "slot-error" : undefined}>
            <legend className="sr-only">Choose a delivery slot</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {slots.map((s) => {
                const usable = slotUsable(s);
                const blockedNames = lines.filter((l) => !restaurantOpenIn(s, l.restaurantId)).map((l) => l.restaurantName);
                return (
                  <label
                    key={s.key}
                    className={cn(
                      "relative flex cursor-pointer flex-col rounded-[var(--radius-md)] border-2 p-4 transition-colors",
                      slotKey === s.key ? "border-accent bg-accent-tint" : "border-border hover:border-accent",
                      !usable && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={s.key}
                      checked={slotKey === s.key}
                      disabled={!usable}
                      onChange={() => setSlotKey(s.key)}
                      className="absolute top-4 right-4 size-5 accent-[var(--color-accent)]"
                    />
                    <span className="pr-8 font-semibold">
                      {s.slotName} · {s.day}
                    </span>
                    <span className="mt-1 text-[1.0625rem] font-semibold tabular text-accent-ink">{s.deliveryWindow}</span>
                    <span className="mt-0.5 text-small text-muted tabular">Order by {s.orderCloses}</span>
                    {!usable ? (
                      <span className="mt-2 text-small font-bold text-danger-ink">Not available for {[...new Set(blockedNames)].join(", ")}</span>
                    ) : s.status === "CLOSING_SOON" ? (
                      <span className="mt-2 text-small font-bold">Closing soon</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            <FieldError id="slot-error" errors={errors.slot} />
            {slot ? (
              <p className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] bg-warn-tint px-3 py-2.5 text-small">
                <Timer aria-hidden className="size-4 shrink-0" />
                <span>
                  Orders for this slot close at <span className="font-semibold tabular">{slot.orderCloses}</span>.
                </span>
              </p>
            ) : null}
          </fieldset>
        </Step>

        <Step n={2} title="Collection point" done={Boolean(dropPoint)}>
          <fieldset aria-describedby={errors.dropPointId ? "dropPointId-error" : undefined}>
            <legend className="sr-only">Choose where to collect your order</legend>
            <div className="grid gap-3">
              {dropPoints.map((d) => (
                <label
                  key={d.id}
                  className={cn(
                    "relative flex cursor-pointer gap-3 rounded-[var(--radius-md)] border-2 p-4 transition-colors",
                    dropPointId === d.id ? "border-accent bg-accent-tint" : "border-border hover:border-accent",
                  )}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-tint text-success-ink">
                    <MapPin aria-hidden className="size-4" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1 pr-8">
                    <span className="block font-semibold">{d.name}</span>
                    <span className="block text-small text-muted">{d.description}</span>
                    {d.directions && dropPointId === d.id ? <span className="mt-1 block text-small">{d.directions}</span> : null}
                  </span>
                  <input
                    type="radio"
                    name="dropPoint"
                    value={d.id}
                    checked={dropPointId === d.id}
                    onChange={() => setDropPointId(d.id)}
                    className="absolute top-4 right-4 size-5 accent-[var(--color-accent)]"
                  />
                </label>
              ))}
            </div>
            <FieldError id="dropPointId-error" errors={errors.dropPointId} />
          </fieldset>
        </Step>

        <Step n={3} title="Your details">
          {customer ? (
            <p className="mb-4 text-small text-muted">
              Signed in as <span className="font-bold text-ink">{customer.email}</span>
            </p>
          ) : (
            <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[var(--radius-md)] bg-accent-tint px-4 py-3 text-small">
              <span>Have an account?</span>
              <Link href="/login?next=/checkout" className="font-semibold text-accent-ink underline underline-offset-4">
                Sign in
              </Link>
              <span className="text-muted">or continue as a guest below.</span>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" name="name" autoComplete="name" required defaultValue={customer?.name} errors={errors.name} />
            <TextField
              label="Mobile number"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              defaultValue={customer?.phone ?? ""}
              hint="So we can reach you at the drop point."
              errors={errors.phone}
            />
            {customer ? null : (
              <TextField
                label="Email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                hint="We’ll send your confirmation and tracking link here."
                errors={errors.email}
                className="sm:col-span-2"
              />
            )}
          </div>
        </Step>

        <Step n={4} title="Review & allergens">
          {quote ? (
            <ul className="divide-y divide-border rounded-[var(--radius-md)] bg-surface">
              {quote.lines.map((l) => (
                <li key={l.menuItemId} className="px-4 py-3">
                  <div className="flex justify-between gap-3">
                    <p>
                      <span className="font-semibold tabular">{l.quantity} ×</span> {l.name}
                      <span className="text-small text-muted"> · {l.restaurantName}</span>
                    </p>
                    <p className="font-semibold tabular">{formatPence(l.lineTotalPence)}</p>
                  </div>
                  <p className="mt-0.5 text-small text-muted">
                    Contains: {allergenSummary(l.allergens, l.noAllergens)}
                    {l.mayContain.length ? ` · May contain: ${l.mayContain.map((a) => allergenLabel(a as Allergen)).join(", ")}` : ""}
                  </p>
                  {l.problem ? <p className="mt-1 text-small font-bold text-danger-ink">No longer available. Remove it from your basket.</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-24 animate-pulse rounded-[var(--radius-md)] bg-surface" />
          )}
          <div className="mt-5 space-y-1">
            <Checkbox
              label={
                <>
                  I accept the{" "}
                  <Link href="/legal/terms" target="_blank" className="font-bold underline underline-offset-4">
                    terms of sale
                  </Link>{" "}
                  and have checked the allergen information above
                </>
              }
              name="terms"
              required
              errors={errors.terms}
            />
            {customer?.marketingOptIn ? null : <Checkbox label="Email me occasional offers (optional)" name="marketing" />}
          </div>
        </Step>
      </div>

      <aside aria-label="Order total" className="lg:sticky lg:top-20">
        <div className="rounded-[var(--radius-lg)] bg-bg p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-h3 font-bold">Order summary</h2>
          {quote ? <OrderSummary subtotalPence={quote.subtotalPence} fees={quote.fees} totalPence={quote.totalPence} totalLabel="Pay on delivery" /> : <div className="h-28 animate-pulse rounded bg-surface" />}
          <p className="mt-4 flex gap-2 rounded-[var(--radius-md)] bg-orange-tint px-3 py-2.5 text-small">
            <Wallet aria-hidden className="mt-0.5 size-4 shrink-0 text-orange-ink" />
            <span>{paymentInstructions}</span>
          </p>
          {slot ? (
            <p className="mt-3 text-small">
              <span className="font-semibold">
                {slot.slotName} · {slot.day}
              </span>{" "}
              · delivered {slot.deliveryWindow}
              {dropPoint ? ` to ${dropPoint.name}` : ""}
            </p>
          ) : null}
          <div id="checkout-message" tabIndex={-1} role="alert" className="outline-none">
            {message ? (
              <p className="mt-3 flex gap-2 rounded-[var(--radius-sm)] border-l-4 border-danger bg-danger-tint px-3 py-2 text-small font-bold text-danger-ink">
                <AlertTriangle aria-hidden className="size-4 shrink-0" /> {message}
              </p>
            ) : null}
          </div>
          {problems.length ? (
            <Link href="/cart" className={buttonClass("secondary", "md", "mt-4 w-full")}>
              Fix your basket
            </Link>
          ) : (
            <button type="submit" disabled={placing || quoting || !quote} className={buttonClass("primary", "md", "mt-4 w-full min-h-14 text-[1.0625rem]")}>
              {placing ? "Placing order…" : quote ? `Place order · ${formatPence(quote.totalPence)}` : "Checking prices…"}
            </button>
          )}
          <p className="mt-2 text-center text-[0.8125rem] text-muted">No payment now. Pay when you collect.</p>
        </div>
      </aside>
    </form>
  );
}
