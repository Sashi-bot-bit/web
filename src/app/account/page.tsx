import type { Metadata } from "next";
import { Chip } from "@/components/ui/chip";
import { db } from "@/server/db";
import { requireCustomerPage } from "@/server/require-customer";
import { formatUkMobile } from "@/shared/contact";
import { AccountActions } from "./account-actions";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const customer = await requireCustomerPage("/account");
  const [{ welcome }, profile] = await Promise.all([
    searchParams,
    db.user.findUniqueOrThrow({ where: { id: customer.id }, select: { phone: true, marketingOptIn: true } }),
  ]);
  return (
    <>
      {welcome ? (
        <p role="status" className="mb-6 rounded-[var(--radius-sm)] border-l-4 border-success bg-success-tint px-3 py-2 text-small font-bold text-success-ink">
          Welcome, {customer.name}. We’ve emailed you a link to confirm your address.
        </p>
      ) : null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-4 py-3">
        <div>
          <p className="text-small text-muted">Email</p>
          <p className="font-bold break-all">{customer.email}</p>
        </div>
        {customer.emailVerified ? <Chip tone="success">Confirmed</Chip> : <Chip tone="warn">Not confirmed</Chip>}
      </div>
      <ProfileForm defaults={{ name: customer.name, phone: profile.phone ? formatUkMobile(profile.phone) : "", marketingOptIn: profile.marketingOptIn }} />
      <AccountActions email={customer.email} verified={customer.emailVerified} />
    </>
  );
}
