import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, MapPin, ShoppingBag, Timer, Wallet } from "lucide-react";
import { DeliveryTimes, SlotCard, SlotCardSkeleton } from "@/components/shop/slot-hero";
import { getDropPoints, getRestaurants } from "@/server/catalog";
import { coverFor, cuisineOf, FOOD_PHOTOS, type Cuisine } from "@/lib/food-images";

const CRAVINGS: { cuisine: Cuisine; label: string }[] = [
  { cuisine: "chicken", label: "Fried chicken" },
  { cuisine: "burger", label: "Burgers & wraps" },
  { cuisine: "curry", label: "Curry & biryani" },
  { cuisine: "pizza", label: "Pizza" },
];

const STEPS = [
  { icon: ShoppingBag, title: "Pick your food", body: "Mix dishes from different restaurants in one basket." },
  { icon: Timer, title: "Order before the cutoff", body: "Each delivery slot has an ordering window. Get in before it closes." },
  { icon: MapPin, title: "Collect on campus", body: "We bring everything to your drop point during the delivery window." },
  { icon: Wallet, title: "Pay when you collect", body: "Cash or card at the drop point. No payment online." },
];

export default async function HomePage() {
  const [restaurants, dropPoints] = await Promise.all([getRestaurants(), getDropPoints()]);
  const withCuisine = restaurants.map((r) => ({ ...r, cuisine: cuisineOf([r.name, r.description, ...r.categories].join(" ")) }));
  const cravings = CRAVINGS.map((c) => ({ ...c, restaurant: withCuisine.find((r) => r.cuisine === c.cuisine) ?? (c.cuisine === "burger" ? withCuisine.find((r) => r.cuisine === "chicken") : undefined) })).filter(
    (c) => c.restaurant,
  );

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="overflow-hidden bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 pb-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12 lg:pt-14 lg:pb-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-bg px-3 py-1 text-small font-bold shadow-[0_1px_0_rgb(0_0_0/0.04)]">
              <span aria-hidden className="size-2 rounded-full bg-success" />
              Hatfield restaurants, delivered to campus
            </p>
            <h1 id="hero-heading" className="mt-4 text-[2.5rem] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[3.25rem] lg:text-[3.75rem]">
              Hungry? Your favourite local food, <span className="text-accent">brought to campus.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[1.0625rem] leading-7 text-ink-2">
              Fried chicken, curries, pizza and more from local Hatfield restaurants. Order before the cutoff, collect at your drop point and pay when you
              pick up.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="#restaurants"
                className="inline-flex min-h-13 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-6 font-bold text-on-accent hover:bg-accent-hover"
              >
                Order now <ArrowRight aria-hidden className="size-5" />
              </Link>
              <Link href="#how-it-works" className="inline-flex min-h-13 items-center px-3 font-bold underline-offset-4 hover:underline">
                How it works
              </Link>
            </div>
            <div className="mt-8">
              <Suspense fallback={<SlotCardSkeleton />}>
                <SlotCard />
              </Suspense>
            </div>
          </div>

          {/* Photo collage */}
          <div aria-hidden className="relative order-first grid h-[260px] grid-cols-[1.4fr_1fr] grid-rows-2 gap-3 sm:h-[360px] lg:order-none lg:h-[520px]">
            <div className="relative row-span-2 overflow-hidden rounded-[var(--radius-lg)]">
              <Image src={FOOD_PHOTOS.pizza.src} alt="" fill priority sizes="(min-width: 1024px) 34vw, 60vw" className="object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
              <Image src={FOOD_PHOTOS.curry.src} alt="" fill sizes="(min-width: 1024px) 22vw, 40vw" className="object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)]">
              <Image src={FOOD_PHOTOS.chicken.src} alt="" fill sizes="(min-width: 1024px) 22vw, 40vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-3 left-4 hidden items-center gap-2 rounded-full bg-bg px-4 py-2 text-small font-bold shadow-[var(--shadow-float)] sm:flex">
              <Wallet className="size-4 text-accent" /> Pay on collection · cash or card
            </div>
          </div>
        </div>
      </section>

      {/* Cravings */}
      {cravings.length ? (
        <section aria-labelledby="cravings-heading" className="mx-auto max-w-6xl px-4 pt-12">
          <h2 id="cravings-heading" className="text-h1 font-bold">
            What are you craving?
          </h2>
          <ul className="no-scrollbar -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
            {cravings.map((c) => (
              <li key={c.cuisine} className="w-40 shrink-0 snap-start sm:w-auto">
                <Link href={`/r/${c.restaurant!.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-surface">
                    <Image
                      src={FOOD_PHOTOS[c.cuisine].src}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 25vw, 160px"
                      className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 font-bold group-hover:underline group-hover:underline-offset-4">{c.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Restaurants */}
      <section id="restaurants" aria-labelledby="restaurants-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 id="restaurants-heading" className="text-h1 font-bold">
            Restaurants near campus
          </h2>
          <p className="text-small text-muted">{restaurants.length} in Hatfield</p>
        </div>
        {restaurants.length === 0 ? (
          <p className="mt-4 text-muted">No restaurants are listed right now.</p>
        ) : (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {withCuisine.map((r) => {
              const cover = coverFor(r);
              return (
                <li key={r.id}>
                  <Link href={`/r/${r.slug}`} className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg transition-shadow hover:shadow-[var(--shadow-float)]">
                    <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                      <Image
                        src={cover.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      />
                      {r.orderableItems === 0 ? (
                        <span className="absolute top-3 left-3 rounded-full bg-bg px-3 py-1 text-small font-bold">Menu coming soon</span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-h3 font-bold">{r.name}</h3>
                        <ArrowRight aria-hidden className="mt-0.5 size-5 shrink-0 text-ink-2 transition-transform group-hover:translate-x-0.5" />
                      </div>
                      <p className="mt-1 text-small text-muted">{r.description}</p>
                      {r.categories.length ? (
                        <ul aria-label="Menu sections" className="mt-3 flex flex-wrap gap-1.5">
                          {r.categories.slice(0, 3).map((c) => (
                            <li key={c} className="rounded-full bg-surface px-2.5 py-0.5 text-[0.8125rem] font-bold text-ink-2">
                              {c}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Delivery times */}
      <section aria-labelledby="times-heading" className="mx-auto max-w-6xl px-4 pt-14">
        <h2 id="times-heading" className="text-h2 font-bold">
          Delivery times
        </h2>
        <p className="mt-1 mb-4 text-small text-muted">Order during the window, then collect your food when it’s delivered.</p>
        <Suspense fallback={<div className="h-24 animate-pulse rounded-[var(--radius-md)] bg-surface" />}>
          <DeliveryTimes />
        </Suspense>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-14">
        <h2 id="how-heading" className="text-h2 font-bold">
          How it works
        </h2>
        <ol className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-ink">
                <s.icon aria-hidden className="size-5" strokeWidth={2} />
              </span>
              <div>
                <p className="font-bold">{s.title}</p>
                <p className="mt-0.5 text-small text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Drop points */}
      {dropPoints.length ? (
        <section aria-labelledby="drop-heading" className="mx-auto max-w-6xl px-4 pt-14">
          <h2 id="drop-heading" className="text-h2 font-bold">
            Where to collect
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {dropPoints.map((d) => (
              <li key={d.id} className="flex gap-3 rounded-[var(--radius-md)] border border-border p-4">
                <MapPin aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={2} />
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
