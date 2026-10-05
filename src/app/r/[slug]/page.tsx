import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { coverFor } from "@/lib/food-images";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft, Info, ListChecks, MapPin, Wallet } from "lucide-react";
import { featuredOccurrence, isOrderableStatus, restaurantOpenIn } from "@/shared/availability";
import { londonDate } from "@/shared/time";
import { getOccurrences } from "@/server/availability";
import { getRestaurantMenu, getRestaurants } from "@/server/catalog";
import { toSlotView } from "@/server/slot-view";
import { MenuView } from "./menu-view";

type Params = { slug: string };

export async function generateStaticParams() {
  const restaurants = await getRestaurants();
  return restaurants.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const menu = await getRestaurantMenu((await params).slug);
  return menu ? { title: menu.name, description: menu.description } : { title: "Restaurant not found" };
}

async function SlotNotice({ restaurantId, name }: { restaurantId: string; name: string }) {
  await connection();
  const now = new Date();
  const occurrences = await getOccurrences(now);
  const featured = featuredOccurrence(occurrences, now);
  if (!featured) return null;
  const today = londonDate(now);
  const view = toSlotView(featured, today);
  const openNow = isOrderableStatus(featured.status);
  const here = restaurantOpenIn(featured, restaurantId);
  const nextHere = occurrences.find((o) => o.orderClosesAt > now && o.status !== "CLOSED" && o.status !== "FULL" && restaurantOpenIn(o, restaurantId));

  let text: string;
  if (here) {
    text = openNow
      ? `Taking orders for ${view.slotName} until ${view.orderCloses}. Delivered ${view.deliveryWindow}.`
      : `${view.slotName} ordering opens ${view.day.toLowerCase()} at ${view.orderOpens}. Delivered ${view.deliveryWindow}.`;
  } else if (nextHere) {
    const n = toSlotView(nextHere, today);
    text = `${name} isn’t available for ${view.slotName}. Order for ${n.slotName} (${n.day.toLowerCase()}, order ${n.orderOpens}–${n.orderCloses}).`;
  } else {
    text = `${name} isn’t taking orders in the next few days.`;
  }
  return (
    <p className={`flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-small font-semibold ${here ? "bg-green-tint" : "bg-warn-tint"}`}>
      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
      {text}
    </p>
  );
}

async function RestaurantContent({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const menu = await getRestaurantMenu(slug);
  if (!menu) notFound();
  const itemCount = menu.categories.reduce((n, c) => n + c.items.length, 0);
  const cover = coverFor({ coverUrl: menu.coverUrl, name: menu.name, description: menu.description, categories: menu.categories.map((c) => c.name) });
  return (
    <>
      <div className="relative h-56 overflow-hidden bg-surface sm:h-72">
        <Image src={cover.src} alt="" fill priority sizes="100vw" className="object-cover" />
        <span aria-hidden className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />
        <Link
          href="/#restaurants"
          className="absolute top-3 left-3 flex size-11 items-center justify-center rounded-full bg-bg text-ink shadow-[var(--shadow-card)] hover:bg-surface"
        >
          <ArrowLeft aria-hidden className="size-5" />
          <span className="sr-only">All restaurants</span>
        </Link>
      </div>
      <div className="mx-auto max-w-5xl px-4">
        <div className="relative -mt-12 rounded-[var(--radius-lg)] bg-bg p-4 shadow-[var(--shadow-float)] sm:-mt-16 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-tint text-h3 font-bold text-accent-ink ring-4 ring-bg sm:size-16">
              {menu.logoUrl ? <Image src={menu.logoUrl} alt="" fill sizes="64px" className="object-cover" /> : menu.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-[1.5rem] leading-tight font-bold tracking-[-0.01em] sm:text-[2rem]">{menu.name}</h1>
              <p className="mt-0.5 text-small text-muted">{menu.categories.slice(0, 3).map((c) => c.name).join(" • ")}</p>
            </div>
          </div>
          {menu.description ? <p className="mt-3 max-w-prose text-small text-ink-2">{menu.description}</p> : null}
          <ul className="mt-4 grid grid-cols-3 divide-x divide-border rounded-[var(--radius-md)] bg-surface py-2.5 text-center text-[0.8125rem] leading-tight">
            <li className="flex flex-col items-center gap-1 px-1">
              <ListChecks aria-hidden className="size-4 text-accent-ink" />
              <span>
                <span className="font-semibold">{itemCount}</span> dishes
              </span>
            </li>
            <li className="flex flex-col items-center gap-1 px-1">
              <Wallet aria-hidden className="size-4 text-orange-ink" />
              <span className="font-semibold">Pay on collection</span>
            </li>
            <li className="flex flex-col items-center gap-1 px-1">
              <MapPin aria-hidden className="size-4 text-success-ink" />
              <span className="font-semibold">Campus drop points</span>
            </li>
          </ul>
          <div className="mt-3">
            <Suspense fallback={<div className="h-10 animate-pulse rounded-[var(--radius-md)] bg-surface" />}>
              <SlotNotice restaurantId={menu.id} name={menu.name} />
            </Suspense>
          </div>
        </div>
      </div>
      {itemCount === 0 ? (
        <p className="mx-auto mt-10 max-w-5xl px-4 text-muted">This menu is being updated. Check back soon.</p>
      ) : (
        <MenuView restaurant={{ id: menu.id, name: menu.name, slug: menu.slug }} categories={menu.categories} />
      )}
    </>
  );
}

export default function RestaurantPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<div className="h-60 animate-pulse bg-surface" />}>
      <RestaurantContent params={params} />
    </Suspense>
  );
}
