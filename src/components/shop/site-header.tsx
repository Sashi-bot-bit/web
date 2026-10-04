import Link from "next/link";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { currentCustomer } from "@/server/session";
import { CartButton } from "./cart-button";

async function AccountLink() {
  const customer = await currentCustomer();
  if (!customer) {
    return (
      <Link href="/login" className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-3 text-small font-bold hover:bg-surface">
        Sign in
      </Link>
    );
  }
  return (
    <Link href="/account" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-small font-bold hover:bg-surface">
      <UserRound aria-hidden className="size-5" strokeWidth={1.75} />
      <span className="hidden max-w-32 truncate sm:inline">{customer.name.split(" ")[0]}</span>
      <span className="sr-only">Your account</span>
    </Link>
  );
}

export function SiteHeader({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 text-h3 font-bold tracking-[-0.02em]">
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-accent" />
          {brand}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <Link href="/support" className="hidden min-h-11 items-center rounded-[var(--radius-sm)] px-3 text-small font-bold hover:bg-surface sm:inline-flex">
            Help
          </Link>
          <Suspense fallback={<span className="inline-block h-11 w-16" aria-hidden />}>
            <AccountLink />
          </Suspense>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
