import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Your basket" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-6">
      <h1 className="text-h1 font-bold">Your basket</h1>
      <CartView />
    </div>
  );
}
