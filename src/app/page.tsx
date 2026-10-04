import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Clock3, MapPin, Wallet } from "lucide-react";
import { SlotHero, SlotHeroSkeleton } from "@/components/shop/slot-hero";
import { getDropPoints, getRestaurants } from "@/server/catalog";

const STEPS = [
  { icon: Clock3, title: "Order before the cutoff", body: "Pick from local restaurants while the ordering window is open." },
  { icon: MapPin, title: "Choose a drop point", body: "We collect from the restaurants and bring everything to campus." },
  { icon: Wallet, title: "Collect and pay", body: "Meet us at your drop point in the delivery window. Pay by cash or card." },
];

export default async function HomePage() {
  const [restaurants, dropPoints] = await Promise.all([getRestaurants(), getDropPoints()]);
  return (
    <>
      <Suspense fallback={<SlotHeroSkeleton />}>
        <SlotHero />
      </Suspense>

      <section aria-labelledby="how-heading" className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h2 id="how-heading" className="sr-only">
            How it works
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-small font-bold tabular">{i + 1}</span>
                <div>
                  <p className="font-bold">{s.title}</p>
                  <p className="mt-0.5 text-small text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="restaurants" aria-labelledby="restaurants-heading" className="mx-auto max-w-5xl scroll-mt-20 px-4 pt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 id="restaurants-heading" className="text-h1 font-bold">
            Restaurants
          </h2>
          <p className="text-small text-muted">{restaurants.length} in Hatfield</p>
        </div>
        {restaurants.length === 0 ? (
          <p className="mt-4 text-muted">No restaurants are listed right now.</p>
        ) : (
          <ul className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r, index) => (
              <li key={r.id}>
                <Link href={`/r/${r.slug}`} className="group block rounded-[var(--radius-md)] focus-visible:outline-offset-4">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-md)] bg-surface">
                    {r.coverUrl ? (
                      <Image
                        src={r.coverUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        priority={index === 0}
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div aria-hidden className="flex h-full flex-col justify-between p-5">
                        <span className="text-label font-bold uppercase tracking-[0.06em] text-muted">{r.categories.slice(0, 3).join(" · ")}</span>
                        <span className="text-[2rem] leading-[1.05] font-bold tracking-[-0.03em] text-ink">{r.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-h3 font-bold group-hover:underline group-hover:underline-offset-4">{r.name}</h3>
                      <p className="mt-0.5 text-small text-muted">{r.description}</p>
                    </div>
                    <ArrowRight aria-hidden className="mt-1 size-5 shrink-0 text-ink-2 transition-transform group-hover:translate-x-0.5" />
                  </div>
                  {r.orderableItems === 0 ? <p className="mt-1 text-small font-bold text-danger-ink">Menu coming soon</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {dropPoints.length ? (
        <section aria-labelledby="drop-heading" className="mx-auto max-w-5xl px-4 pt-16">
          <h2 id="drop-heading" className="text-h2 font-bold">
            Drop points
          </h2>
          <p className="mt-1 text-small text-muted">Choose one at checkout. Collect your order there during the delivery window.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {dropPoints.map((d) => (
              <li key={d.id} className="flex gap-3 rounded-[var(--radius-md)] border border-border p-4">
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
                <div>
                  <p className="font-bold">{d.name}</p>
                  <p className="text-small text-muted">{d.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
