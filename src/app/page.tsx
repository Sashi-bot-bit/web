import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ChevronRight, MapPin, ShoppingBag, Store, Timer, Wallet } from "lucide-react";
import { DeliveryTimes, SlotCard, SlotCardSkeleton } from "@/components/shop/slot-hero";
import { getDropPoints, getHomeContent, getRestaurants } from "@/server/catalog";
import { Posters } from "@/components/shop/posters";
import { coverFor, cuisineOf, FOOD_PHOTOS, type Cuisine } from "@/lib/food-images";

const CRAVINGS: { cuisine: Cuisine; label: string }[] = [
  { cuisine: "chicken", label: "Chicken" },
  { cuisine: "burger", label: "Burgers" },
  { cuisine: "curry", label: "Curry" },
  { cuisine: "pizza", label: "Pizza" },
];

const FEATURES = [
  { icon: Store, label: "Local favourites", tint: "bg-accent-tint text-accent-ink" },
  { icon: Wallet, label: "Pay on collection", tint: "bg-orange-tint text-orange-ink" },
  { icon: MapPin, label: "Collect on campus", tint: "bg-green-tint text-success-ink" },
];

const STEPS = [
  { icon: ShoppingBag, title: "Pick your food", body: "Mix dishes from different restaurants in one basket." },
  { icon: Timer, title: "Order before the cutoff", body: "Each delivery slot has an ordering window. Get in before it closes." },
  { icon: MapPin, title: "Collect on campus", body: "We bring everything to your drop point during the delivery window." },
  { icon: Wallet, title: "Pay when you collect", body: "Cash or card at the drop point. No payment online." },
];

export default async function HomePage() {
  const [restaurants, dropPoints, home] = await Promise.all([getRestaurants(), getDropPoints(), getHomeContent()]);
  const heroImages = [
    home.heroImage1 ?? FOOD_PHOTOS.burger.src,
    home.heroImage2 ?? FOOD_PHOTOS.pizza.src,
    home.heroImage3 ?? FOOD_PHOTOS.curry.src,
  ];
  const withCuisine = restaurants.map((r) => ({ ...r, cuisine: cuisineOf([r.name, r.description, ...r.categories].join(" ")) }));
  const cravings = CRAVINGS.map((c) => ({
    ...c,
    restaurant:
      withCuisine.find((r) => r.cuisine === c.cuisine) ??
      (c.cuisine === "burger" ? withCuisine.find((r) => r.cuisine === "chicken") : undefined),
  })).filter((c) => c.restaurant);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 pb-4 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:pt-12 lg:pb-8">
          <div>
            <div className="grid grid-cols-[1fr_auto] items-start gap-3 lg:block">
              <div>
                <p className="text-small font-semibold text-accent-ink">{home.heroEyebrow}</p>
                <h1
                  id="hero-heading"
                  className="mt-2 text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] sm:text-[3rem] lg:text-[3.5rem]"
                >
                  {home.heroTitle}
                  {home.heroHighlight ? (
                    <>
                      {" "}
                      <span className="text-accent">{home.heroHighlight}</span>
                    </>
                  ) : null}
                </h1>
              </div>
              {/* Phone: a round food photo beside the headline */}
              <div aria-hidden className="relative mt-2 size-28 shrink-0 sm:size-36 lg:hidden">
                <span className="absolute inset-0 translate-x-2.5 -translate-y-2 rounded-full bg-warn" />
                <span className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-bg">
                  <Image src={heroImages[0]} alt="" fill priority sizes="144px" className="object-cover" />
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-lg text-[1rem] leading-7 text-ink-2">{home.heroSubtitle}</p>

            <ul className="mt-6 grid max-w-md grid-cols-3 gap-2">
              {FEATURES.map((f) => (
                <li key={f.label} className="flex flex-col items-center text-center">
                  <span className={`flex size-14 items-center justify-center rounded-full ${f.tint}`}>
                    <f.icon aria-hidden className="size-6" strokeWidth={2.25} />
                  </span>
                  <span className="mt-2 text-small leading-tight font-semibold">{f.label}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 max-w-md">
              <Suspense fallback={<SlotCardSkeleton />}>
                <SlotCard />
              </Suspense>
            </div>
            <Link
              href="#restaurants"
              className="mt-5 inline-flex min-h-13 w-full max-w-md items-center justify-center gap-2 rounded-full bg-accent px-7 font-semibold text-on-accent hover:bg-accent-hover sm:w-auto"
            >
              {home.heroCtaLabel} <ArrowRight aria-hidden className="size-5" />
            </Link>
          </div>

          {/* Desktop: round photos on a yellow disc */}
          <div aria-hidden className="relative hidden aspect-square w-full max-w-[520px] justify-self-center lg:block">
            <span className="absolute inset-[6%] translate-x-[6%] -translate-y-[4%] rounded-full bg-warn" />
            <span className="absolute inset-[6%] overflow-hidden rounded-full ring-8 ring-bg">
              <Image src={heroImages[0]} alt="" fill priority sizes="520px" className="object-cover" />
            </span>
            <span className="absolute bottom-[4%] left-[2%] size-[30%] overflow-hidden rounded-full shadow-[var(--shadow-card)] ring-8 ring-bg">
              <Image src={heroImages[1]} alt="" fill sizes="160px" className="object-cover" />
            </span>
            <span className="absolute top-[8%] right-0 size-[24%] overflow-hidden rounded-full shadow-[var(--shadow-card)] ring-8 ring-bg">
              <Image src={heroImages[2]} alt="" fill sizes="130px" className="object-cover" />
            </span>
          </div>
        </div>
      </section>

      {/* Restaurants */}
      <section id="restaurants" aria-labelledby="restaurants-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="restaurants-heading" className="text-h2 font-bold">
            {home.restaurantsTitle}
          </h2>
          <p className="shrink-0 text-small text-muted">{restaurants.length} in Hatfield</p>
        </div>
        {restaurants.length === 0 ? (
          <p className="mt-4 text-muted">No restaurants are listed right now.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {withCuisine.map((r) => {
              const cover = coverFor(r);
              return (
                <li key={r.id}>
                  <Link
                    href={`/r/${r.slug}`}
                    className="group flex items-center gap-4 rounded-[var(--radius-lg)] bg-bg p-3 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-float)]"
                  >
                    <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface sm:h-24 sm:w-28">
                      <Image
                        src={cover.src}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1.0625rem] leading-snug font-semibold">{r.name}</span>
                      <span className="mt-0.5 block truncate text-small text-muted">{r.categories.slice(0, 3).join(" • ")}</span>
                      {r.orderableItems === 0 ? (
                        <span className="mt-1 inline-block rounded-full bg-surface px-2 py-0.5 text-[0.8125rem] font-semibold">Menu coming soon</span>
                      ) : null}
                    </span>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Posters from admin */}
      <Suspense>
        <Posters title={home.postersTitle} />
      </Suspense>

      {/* Cravings */}
      {home.showCravings && cravings.length ? (
        <section aria-labelledby="cravings-heading" className="mx-auto max-w-6xl px-4 pt-10">
          <h2 id="cravings-heading" className="text-h2 font-bold">
            {home.cravingsTitle}
          </h2>
          <ul className="no-scrollbar -mx-4 mt-4 flex gap-5 overflow-x-auto px-4 sm:mx-0 sm:gap-8 sm:px-0">
            {cravings.map((c) => (
              <li key={c.cuisine} className="shrink-0">
                <Link href={`/r/${c.restaurant!.slug}`} className="group flex w-20 flex-col items-center text-center sm:w-28">
                  <span className="relative size-20 overflow-hidden rounded-full bg-surface ring-2 ring-transparent ring-offset-2 transition group-hover:ring-accent sm:size-28">
                    <Image src={FOOD_PHOTOS[c.cuisine].src} alt="" fill sizes="112px" className="object-cover" />
                  </span>
                  <span className="mt-2 text-small font-semibold">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Delivery times */}
      <section aria-labelledby="times-heading" className="mx-auto max-w-6xl px-4 pt-12">
        <h2 id="times-heading" className="text-h2 font-bold">
          Delivery times
        </h2>
        <p className="mt-1 mb-4 text-small text-muted">Order during the window, then collect your food when it’s delivered.</p>
        <Suspense fallback={<div className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-surface" />}>
          <DeliveryTimes />
        </Suspense>
      </section>

      {/* How it works */}
      {home.showHowItWorks ? (
        <section id="how-it-works" aria-labelledby="how-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-12">
          <h2 id="how-heading" className="text-h2 font-bold">
            How it works
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-[var(--radius-lg)] bg-bg p-4 shadow-[var(--shadow-card)]">
                <span className="flex size-11 items-center justify-center rounded-full bg-accent-tint text-accent-ink">
                  <s.icon aria-hidden className="size-5" strokeWidth={2.25} />
                </span>
                <p className="mt-3 font-semibold">
                  <span className="text-accent-ink">{i + 1}.</span> {s.title}
                </p>
                <p className="mt-0.5 text-small text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* Drop points */}
      {dropPoints.length ? (
        <section aria-labelledby="drop-heading" className="mx-auto max-w-6xl px-4 pt-12">
          <h2 id="drop-heading" className="text-h2 font-bold">
            Where to collect
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {dropPoints.map((d) => (
              <li key={d.id} className="flex gap-3 rounded-[var(--radius-lg)] bg-bg p-4 shadow-[var(--shadow-card)]">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-tint text-success-ink">
                  <MapPin aria-hidden className="size-5" strokeWidth={2.25} />
                </span>
                <div>
                  <p className="font-semibold">{d.name}</p>
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
