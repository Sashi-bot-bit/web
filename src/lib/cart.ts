"use client";

import { useSyncExternalStore } from "react";

/** Display-only copy of item details; the server re-prices everything at checkout. */
export type CartLine = {
  menuItemId: string;
  quantity: number;
  name: string;
  unitPricePence: number;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
};

type CartState = { lines: CartLine[] };

const KEY = "ce-cart-v1";
const EMPTY: CartState = { lines: [] };
export const MAX_QTY_PER_LINE = 10;

let state: CartState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): CartState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed.lines)) return EMPTY;
    return {
      lines: parsed.lines.filter(
        (l) => typeof l.menuItemId === "string" && Number.isInteger(l.quantity) && l.quantity > 0 && l.quantity <= 99,
      ),
    };
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    state = read();
    loaded = true;
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) {
        state = read();
        listeners.forEach((l) => l());
      }
    });
  }
}

function write(next: CartState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode): the cart still works for this tab.
  }
  listeners.forEach((l) => l());
}

export const cart = {
  add(line: Omit<CartLine, "quantity">, quantity = 1) {
    ensureLoaded();
    const existing = state.lines.find((l) => l.menuItemId === line.menuItemId);
    const lines = existing
      ? state.lines.map((l) =>
          l.menuItemId === line.menuItemId ? { ...l, ...line, quantity: Math.min(MAX_QTY_PER_LINE, l.quantity + quantity) } : l,
        )
      : [...state.lines, { ...line, quantity: Math.min(MAX_QTY_PER_LINE, quantity) }];
    write({ lines });
  },
  setQuantity(menuItemId: string, quantity: number) {
    ensureLoaded();
    const q = Math.max(0, Math.min(MAX_QTY_PER_LINE, Math.floor(quantity)));
    write({
      lines: q === 0 ? state.lines.filter((l) => l.menuItemId !== menuItemId) : state.lines.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: q } : l)),
    });
  },
  /** Refresh display prices/names from a server quote. */
  sync(updates: { menuItemId: string; name: string; unitPricePence: number }[]) {
    ensureLoaded();
    const byId = new Map(updates.map((u) => [u.menuItemId, u]));
    write({ lines: state.lines.map((l) => (byId.has(l.menuItemId) ? { ...l, ...byId.get(l.menuItemId)! } : l)) });
  },
  remove(menuItemId: string) {
    cart.setQuantity(menuItemId, 0);
  },
  clear() {
    ensureLoaded();
    write(EMPTY);
  },
};

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return state;
    },
    () => EMPTY,
  );
  const count = snapshot.lines.reduce((n, l) => n + l.quantity, 0);
  const subtotalPence = snapshot.lines.reduce((n, l) => n + l.quantity * l.unitPricePence, 0);
  return { lines: snapshot.lines, count, subtotalPence };
}
