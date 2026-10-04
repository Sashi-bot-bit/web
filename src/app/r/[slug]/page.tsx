import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeft, Info } from "lucide-react";
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
    <p className={`flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2.5 text-small font-bold ${here ? "bg-surface" : "bg-warn-tint"}`}>
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
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <Link href="/#restaurants" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-small font-bold text-ink-2 hover:text-ink">
          <ChevronLeft aria-hidden className="size-4" /> All restaurants
        </Link>
        <h1 className="mt-1 text-[2rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2.5rem]">{menu.name}</h1>
        <p className="mt-1 max-w-prose text-muted">{menu.description}</p>
        <div className="mt-4">
          <Suspense fallback={<div className="h-10 animate-pulse rounded-[var(--radius-md)] bg-surface" />}>
            <SlotNotice restaurantId={menu.id} name={menu.name} />
          </Suspense>
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
    <Suspense fallback={<div className="mx-auto mt-6 h-64 max-w-5xl animate-pulse rounded-[var(--radius-md)] bg-surface px-4" />}>
      <RestaurantContent params={params} />
    </Suspense>
  );
}
