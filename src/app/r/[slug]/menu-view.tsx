"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { MenuItemView } from "@/server/catalog";
import { formatPence } from "@/shared/money";
import { unitPrice } from "@/shared/fees";
import { cart, MAX_QTY_PER_LINE, useCart } from "@/lib/cart";
import { cn } from "@/components/ui/cn";
import { AllergenInfo, DietaryBadges, Spice } from "@/components/shop/food-info";
import { Price } from "@/components/shop/price";

type Category = { id: string; name: string; items: MenuItemView[] };
type Restaurant = { id: string; name: string; slug: string };

export function MenuView({ restaurant, categories }: { restaurant: Restaurant; categories: Category[] }) {
  const [active, setActive] = useState(categories[0]?.id);
  const [openItem, setOpenItem] = useState<MenuItemView | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { lines } = useCart();
  const inCart = new Map(lines.map((l) => [l.menuItemId, l.quantity]));

  // Scroll-spy: highlight the category whose heading is nearest the top.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    categories.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  // Keep the active tab visible in the scrolling tab bar.
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>(`[data-cat="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  // Open an item from ?item= (shareable links) once on load.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("item");
    const item = id ? categories.flatMap((c) => c.items).find((i) => i.id === id) : null;
    if (!item) return;
    const frame = requestAnimationFrame(() => setOpenItem(item));
    return () => cancelAnimationFrame(frame);
  }, [categories]);

  const show = useCallback((item: MenuItemView | null) => {
    setOpenItem(item);
    const url = new URL(window.location.href);
    if (item) url.searchParams.set("item", item.id);
    else url.searchParams.delete("item");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  function add(item: MenuItemView, quantity: number) {
    cart.add(
      {
        menuItemId: item.id,
        name: item.name,
        unitPricePence: unitPrice(item),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        restaurantSlug: restaurant.slug,
      },
      quantity,
    );
    setAnnouncement(`Added ${quantity} × ${item.name} to your basket.`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <nav aria-label="Menu categories" className="sticky top-14 z-20 mt-6 border-b border-border bg-bg">
        <div ref={tabsRef} className="no-scrollbar flex gap-1 overflow-x-auto px-4">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              data-cat={c.id}
              aria-current={active === c.id ? "true" : undefined}
              onClick={() => setActive(c.id)}
              className={cn(
                "relative inline-flex min-h-12 shrink-0 items-center px-3 text-small font-bold whitespace-nowrap",
                active === c.id ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {c.name}
              <span aria-hidden className={cn("absolute inset-x-3 bottom-0 h-0.5 rounded-full", active === c.id ? "bg-accent" : "bg-transparent")} />
            </a>
          ))}
        </div>
      </nav>

      <div className="px-4">
        {categories.map((c) => (
          <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`h-${c.id}`} className="scroll-mt-32 pt-8">
            <h2 id={`h-${c.id}`} className="text-h2 font-bold">
              {c.name}
            </h2>
            <ul className="mt-2 divide-y divide-border">
              {c.items.map((item) => {
                const qty = inCart.get(item.id);
                return (
                  <li key={item.id} className="relative flex gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">
                        <button
                          type="button"
                          onClick={() => show(item)}
                          className="text-left after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4"
                        >
                          {item.name}
                        </button>
                      </h3>
                      {item.description ? <p className="mt-0.5 line-clamp-2 text-small text-muted">{item.description}</p> : null}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Price pricePence={item.pricePence} discountedPricePence={item.discountedPricePence} />
                        {item.kcal != null ? <span className="text-small text-muted tabular">{item.kcal} kcal</span> : null}
                        <Spice level={item.spiceLevel} />
                        <DietaryBadges tags={item.dietary} />
                      </div>
                      {!item.orderable ? <p className="mt-1.5 text-small font-bold text-danger-ink">Not available to order</p> : null}
                    </div>
                    {item.imageUrl ? (
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface sm:size-28">
                        <Image src={item.imageUrl} alt="" fill sizes="112px" className="object-cover" />
                      </div>
                    ) : null}
                    <div className="relative z-10 flex shrink-0 items-start">
                      {item.orderable ? (
                        <button
                          type="button"
                          onClick={() => add(item, 1)}
                          aria-label={`Add ${item.name} to basket`}
                          className={cn(
                            "flex size-11 items-center justify-center rounded-full border font-bold tabular",
                            qty ? "border-ink bg-ink text-on-dark" : "border-border-strong bg-bg hover:border-ink",
                          )}
                        >
                          {qty ? <span aria-hidden>{qty}</span> : <Plus aria-hidden className="size-5" />}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <ItemSheet item={openItem} onClose={() => show(null)} onAdd={add} />
    </div>
  );
}

function ItemSheet({ item, onClose, onAdd }: { item: MenuItemView | null; onClose: () => void; onAdd: (item: MenuItemView, qty: number) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [qty, setQty] = useState(1);
  const [shownId, setShownId] = useState<string | null>(null);
  if ((item?.id ?? null) !== shownId) {
    setShownId(item?.id ?? null);
    setQty(1);
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="item-sheet-title"
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[var(--radius-lg)] bg-bg p-0 text-ink shadow-[var(--shadow-float)] backdrop:bg-black/50 sm:inset-0 sm:m-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-[var(--radius-lg)] open:animate-[sheet-in_220ms_var(--ease-out)]"
    >
      {item ? (
        <div className="flex max-h-[92dvh] flex-col sm:max-h-[85dvh]">
          <div className="overflow-y-auto">
            {item.imageUrl ? (
              <div className="relative aspect-[16/10] bg-surface">
                <Image src={item.imageUrl} alt="" fill sizes="(min-width: 640px) 512px, 100vw" className="object-cover" />
              </div>
            ) : null}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 id="item-sheet-title" className="text-h2 font-bold">
                  {item.name}
                </h2>
                <button type="button" onClick={onClose} className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-surface">
                  <X aria-hidden className="size-5" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Price pricePence={item.pricePence} discountedPricePence={item.discountedPricePence} className="text-h3" />
                {item.kcal != null ? <span className="text-small text-muted tabular">{item.kcal} kcal</span> : null}
                {item.portionNote ? <span className="text-small text-muted">{item.portionNote}</span> : null}
                <Spice level={item.spiceLevel} />
              </div>
              {item.description ? <p className="mt-3 text-body">{item.description}</p> : null}
              {item.dietary.length ? (
                <div className="mt-3">
                  <DietaryBadges tags={item.dietary} />
                </div>
              ) : null}
              <section aria-labelledby="allergen-title" className="mt-5 rounded-[var(--radius-md)] border border-border p-4">
                <h3 id="allergen-title" className="mb-3 font-bold">
                  Allergens
                </h3>
                <AllergenInfo allergens={item.allergens} mayContain={item.mayContain} confirmed={item.allergensConfirmed} />
                <p className="mt-3 text-[0.8125rem] leading-5 text-muted">
                  Information supplied by the restaurant. If you have a severe allergy, contact us before ordering.
                </p>
              </section>
            </div>
          </div>
          {item.orderable ? (
            <div className="flex items-center gap-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center rounded-full border border-border-strong" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="flex size-11 items-center justify-center rounded-full disabled:opacity-30">
                  <Minus aria-hidden className="size-4" />
                  <span className="sr-only">Decrease quantity</span>
                </button>
                <span className="w-6 text-center font-bold tabular" aria-live="polite">
                  {qty}
                </span>
                <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY_PER_LINE, q + 1))} disabled={qty >= MAX_QTY_PER_LINE} className="flex size-11 items-center justify-center rounded-full disabled:opacity-30">
                  <Plus aria-hidden className="size-4" />
                  <span className="sr-only">Increase quantity</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onAdd(item, qty);
                  onClose();
                }}
                className="flex min-h-13 flex-1 items-center justify-between rounded-[var(--radius-md)] bg-accent px-5 font-bold text-on-accent hover:bg-accent-hover"
              >
                <span>Add to basket</span>
                <span className="tabular">{formatPence(unitPrice(item) * qty)}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
