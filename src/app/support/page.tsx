import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronRight, Mail } from "lucide-react";
import { formatLondonDateTime } from "@/shared/time";
import { getSettings } from "@/server/catalog";
import { db } from "@/server/db";
import { ticketPath } from "@/server/links";
import { findViewableOrder } from "@/server/orders/access";
import { currentCustomer } from "@/server/session";
import { Chip } from "@/components/ui/chip";
import { TicketForm } from "./ticket-form";

export const metadata: Metadata = { title: "Help & contact" };

type SP = Promise<{ order?: string; t?: string }>;

async function SupportContent({ searchParams }: { searchParams: SP }) {
  await connection();
  const [{ order, t }, customer, settings] = await Promise.all([searchParams, currentCustomer(), getSettings()]);
  const linked = order ? await findViewableOrder(order, t) : null;
  const myOrders = customer
    ? await db.order.findMany({ where: { userId: customer.id }, orderBy: { placedAt: "desc" }, take: 10, select: { id: true, number: true, placedAt: true } })
    : [];
  const tickets = customer
    ? await db.supportTicket.findMany({ where: { userId: customer.id }, orderBy: { updatedAt: "desc" }, take: 20, select: { id: true, number: true, subject: true, status: true, updatedAt: true } })
    : [];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <section aria-labelledby="new-heading">
        <h2 id="new-heading" className="text-h2 font-bold">
          Send us a message
        </h2>
        <p className="mt-1 mb-6 text-small text-muted">We usually reply within a few hours during service days.</p>
        <TicketForm
          customer={customer ? { name: customer.name, email: customer.email } : null}
          orders={linked ? [{ id: linked.order.id, number: linked.order.number }] : myOrders.map((o) => ({ id: o.id, number: o.number }))}
          preselectedOrderId={linked?.order.id ?? null}
          orderToken={t ?? null}
        />
      </section>
      <aside className="space-y-6">
        {settings.supportEmail ? (
          <div className="rounded-[var(--radius-md)] bg-surface p-4">
            <p className="flex items-center gap-2 font-bold">
              <Mail aria-hidden className="size-4" /> Email
            </p>
            <a href={`mailto:${settings.supportEmail}`} className="mt-1 inline-block text-small font-bold underline underline-offset-4">
              {settings.supportEmail}
            </a>
          </div>
        ) : null}
        <div className="rounded-[var(--radius-md)] bg-surface p-4 text-small">
          <p className="font-bold">Allergies</p>
          <p className="mt-1 text-muted">
            If you have a severe allergy, message us before ordering. See{" "}
            <Link href="/legal/allergens" className="font-bold text-ink underline underline-offset-4">
              allergen information
            </Link>
            .
          </p>
        </div>
        {tickets.length ? (
          <div>
            <h2 className="font-bold">Your conversations</h2>
            <ul className="mt-2 divide-y divide-border rounded-[var(--radius-md)] border border-border">
              {tickets.map((tk) => (
                <li key={tk.id}>
                  <Link href={ticketPath(tk.id)} className="flex items-center gap-2 px-3 py-2.5 hover:bg-surface">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small font-bold">{tk.subject}</span>
                      <span className="block text-[0.8125rem] text-muted">
                        {tk.number} · {formatLondonDateTime(tk.updatedAt)}
                      </span>
                    </span>
                    {tk.status === "OPEN" ? <Chip tone="info">Open</Chip> : <Chip tone="outline">Resolved</Chip>}
                    <ChevronRight aria-hidden className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export default function SupportPage({ searchParams }: { searchParams: SP }) {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-8">
      <h1 className="mb-6 text-h1 font-bold">Help & contact</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[var(--radius-lg)] bg-surface" />}>
        <SupportContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
