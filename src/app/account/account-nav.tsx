"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";

const LINKS = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/favourites", label: "Favourites" },
  { href: "/account/security", label: "Password" },
  { href: "/account/privacy", label: "Privacy" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn("relative inline-flex min-h-12 shrink-0 items-center px-3 text-small font-bold", active ? "text-ink" : "text-muted hover:text-ink")}
          >
            {l.label}
            <span aria-hidden className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full", active ? "bg-accent" : "bg-transparent")} />
          </Link>
        );
      })}
    </nav>
  );
}
