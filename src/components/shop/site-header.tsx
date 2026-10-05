import Link from "next/link";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { currentCustomer } from "@/server/session";
import { CartButton } from "./cart-button";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

async function Nav() {
  const customer = await currentCustomer();
  const items = [
    { href: "/#restaurants", label: "Restaurants" },
    ...(customer
      ? [
          { href: "/account/orders", label: "My orders" },
          { href: "/account", label: "My account" },
        ]
      : [
          { href: "/login", label: "Sign in" },
          { href: "/signup", label: "Create an account" },
        ]),
    { href: "/support", label: "Help & contact" },
  ];
  return (
    <>
      <div className="hidden items-center gap-1 md:flex">
        <Link href="/#restaurants" className="inline-flex min-h-11 items-center rounded-full px-4 text-small font-semibold hover:bg-surface">
          Restaurants
        </Link>
        <Link href="/support" className="inline-flex min-h-11 items-center rounded-full px-4 text-small font-semibold hover:bg-surface">
          Help
        </Link>
        {customer ? (
          <Link href="/account" className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-small font-semibold hover:bg-surface">
            <UserRound aria-hidden className="size-5" strokeWidth={1.75} />
            <span className="max-w-32 truncate">{customer.name.split(" ")[0]}</span>
          </Link>
        ) : (
          <Link href="/login" className="inline-flex min-h-11 items-center rounded-full px-4 text-small font-semibold hover:bg-surface">
            Sign in
          </Link>
        )}
      </div>
      <MobileMenu items={items} />
    </>
  );
}

export function SiteHeader({ brand }: { brand: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href="/" aria-label={`${brand} home`}>
          <Logo brand={brand} />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <Suspense fallback={<span className="inline-block h-11 w-11" aria-hidden />}>
            <Nav />
          </Suspense>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
