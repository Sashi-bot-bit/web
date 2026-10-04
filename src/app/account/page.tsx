import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Chip } from "@/components/ui/chip";
import { currentCustomer } from "@/server/session";
import { AccountActions } from "./account-actions";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

async function AccountContent({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const customer = await currentCustomer();
  if (!customer) redirect("/login?next=/account");
  const { welcome } = await searchParams;

  return (
    <>
      {welcome ? (
        <p role="status" className="mb-6 rounded-[var(--radius-sm)] border-l-4 border-success bg-success-tint px-3 py-2 text-small font-bold text-success-ink">
          Welcome, {customer.name}. We’ve sent you an email to confirm your address.
        </p>
      ) : null}
      <h1 className="text-h1 font-bold">Your account</h1>
      <dl className="mt-6 divide-y divide-border rounded-[var(--radius-md)] border border-border">
        <div className="px-4 py-3">
          <dt className="text-small text-muted">Name</dt>
          <dd className="font-bold">{customer.name}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <dt className="text-small text-muted">Email</dt>
            <dd className="font-bold break-all">{customer.email}</dd>
          </div>
          {customer.emailVerified ? <Chip tone="success">Confirmed</Chip> : <Chip tone="warn">Not confirmed</Chip>}
        </div>
      </dl>
      <AccountActions email={customer.email} verified={customer.emailVerified} />
    </>
  );
}

export default function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  return (
    <div className="mx-auto max-w-xl px-4 pt-8 pb-6">
      <Suspense fallback={<div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-surface" />}>
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
