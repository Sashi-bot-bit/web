import Link from "next/link";

const LINKS = [
  { href: "/support", label: "Help & contact" },
  { href: "/legal/allergens", label: "Allergen information" },
  { href: "/legal/terms", label: "Terms of sale" },
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/cookies", label: "Cookies" },
];

export function SiteFooter({ brand, supportEmail }: { brand: string; supportEmail: string | null }) {
  return (
    <footer className="mt-20 border-t border-border bg-surface pb-24 md:pb-0">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="flex items-center gap-2 text-h3 font-bold">
            <span aria-hidden className="inline-block size-2.5 rounded-full bg-accent" />
            {brand}
          </p>
          <p className="mt-2 max-w-sm text-small text-muted">
            Lunch and dinner from local Hatfield restaurants, delivered to drop points near campus. Independent business, not affiliated with any university.
          </p>
          {supportEmail ? (
            <p className="mt-3 text-small">
              <a href={`mailto:${supportEmail}`} className="font-bold underline underline-offset-4">
                {supportEmail}
              </a>
            </p>
          ) : null}
        </div>
        <nav aria-label="Footer">
          <ul className="grid gap-1 text-small">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-9 items-center hover:underline hover:underline-offset-4">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
