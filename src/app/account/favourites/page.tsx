import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { unitPrice } from "@/shared/fees";
import { db } from "@/server/db";
import { requireCustomerPage } from "@/server/require-customer";
import { buttonClass } from "@/components/ui/button";
import { Price } from "@/components/shop/price";
import { FavouriteActions } from "./favourite-actions";

export const metadata: Metadata = { title: "Favourites", robots: { index: false } };

export default async function FavouritesPage() {
  const customer = await requireCustomerPage("/account/favourites");
  const favs = await db.favourite.findMany({
    where: { userId: customer.id },
    orderBy: { createdAt: "desc" },
    include: {
      menuItem: {
        include: { restaurant: { select: { id: true, name: true, slug: true, isActive: true, archivedAt: true } }, category: { select: { isActive: true, archivedAt: true } } },
      },
    },
  });

  if (favs.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-border-strong px-6 py-14 text-center">
        <Heart aria-hidden className="size-10 text-muted" strokeWidth={1.5} />
        <p className="mt-4 text-h3 font-bold">No favourites yet</p>
        <p className="mt-1 text-muted">Tap the heart on any dish to save it here.</p>
        <Link href="/#restaurants" className={buttonClass("primary", "md", "mt-6")}>
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
      {favs.map(({ menuItem: i }) => {
        const orderable =
          !i.archivedAt && i.isAvailable && i.restaurant.isActive && !i.restaurant.archivedAt && i.category.isActive && !i.category.archivedAt;
        return (
          <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <Link href={`/r/${i.restaurant.slug}?item=${i.id}`} className="font-bold hover:underline hover:underline-offset-4">
                {i.name}
              </Link>
              <p className="text-small text-muted">
                {i.restaurant.name} · <Price pricePence={i.pricePence} discountedPricePence={i.discountedPricePence} className="text-small" />
              </p>
              {!orderable ? <p className="text-small font-bold text-danger-ink">Not available right now</p> : null}
            </div>
            <FavouriteActions
              item={{
                menuItemId: i.id,
                name: i.name,
                unitPricePence: unitPrice(i),
                restaurantId: i.restaurant.id,
                restaurantName: i.restaurant.name,
                restaurantSlug: i.restaurant.slug,
              }}
              orderable={orderable}
            />
          </li>
        );
      })}
    </ul>
  );
}
