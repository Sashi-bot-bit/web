import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { bannerLive, isExternalLink } from "@/shared/banners";
import { getActiveBanners } from "@/server/catalog";
import { cn } from "@/components/ui/cn";

const THEME = {
  VIOLET: { box: "bg-accent text-on-accent", sub: "text-on-accent", cta: "bg-bg text-ink" },
  DARK: { box: "bg-ink text-on-dark", sub: "text-on-dark-muted", cta: "bg-accent text-on-accent" },
  LIGHT: { box: "bg-surface text-ink", sub: "text-muted", cta: "bg-accent text-on-accent" },
} as const;

/** Posters from admin → Homepage, filtered to their date window. */
export async function Posters({ title }: { title: string }) {
  await connection();
  const now = new Date();
  const banners = (await getActiveBanners()).filter((b) => bannerLive(b, now));
  if (!banners.length) return null;
  return (
    <section aria-labelledby="posters-heading" className="mx-auto max-w-6xl px-4 pt-12">
      <h2 id="posters-heading" className="text-h1 font-bold">
        {title}
      </h2>
      <ul className="no-scrollbar -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
        {banners.map((b) => {
          const t = THEME[b.theme];
          const inner = (
            <div className={cn("flex h-full min-h-44 overflow-hidden rounded-[var(--radius-lg)]", t.box)}>
              <div className="flex flex-1 flex-col justify-between gap-4 p-5 sm:p-6">
                <div>
                  <p className="text-h2 leading-tight font-bold">{b.title}</p>
                  {b.subtitle ? <p className={cn("mt-2 text-small", t.sub)}>{b.subtitle}</p> : null}
                </div>
                {b.ctaLabel && b.linkUrl ? (
                  <span className={cn("inline-flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-md)] px-4 text-small font-bold", t.cta)}>
                    {b.ctaLabel} <ArrowRight aria-hidden className="size-4" />
                  </span>
                ) : null}
              </div>
              {b.imageUrl ? (
                <div className="relative w-2/5 shrink-0">
                  <Image src={b.imageUrl} alt="" fill sizes="(min-width: 640px) 20vw, 40vw" className="object-cover" />
                </div>
              ) : null}
            </div>
          );
          return (
            <li key={b.id} className="w-[85%] shrink-0 snap-start sm:w-auto">
              {b.linkUrl ? (
                isExternalLink(b.linkUrl) ? (
                  <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full transition-opacity hover:opacity-95">
                    {inner}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <Link href={b.linkUrl} className="block h-full transition-opacity hover:opacity-95">
                    {inner}
                  </Link>
                )
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
