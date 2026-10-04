"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ORDER_STATUS_LABEL } from "@/shared/order-state";
import type { OrderStatus } from "@/generated/prisma/enums";

const TERMINAL: OrderStatus[] = ["DELIVERED", "CANCELLED", "NOT_COLLECTED"];

/** Polls every 20 s while the tab is visible; refreshes the page on change. */
export function StatusPoller({ orderId, token, status, updatedAt }: { orderId: string; token: string | null; status: OrderStatus; updatedAt: string }) {
  const router = useRouter();
  const [announcement, setAnnouncement] = useState("");
  const last = useRef(updatedAt);

  useEffect(() => {
    if (TERMINAL.includes(status)) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const check = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status${token ? `?t=${encodeURIComponent(token)}` : ""}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { status: OrderStatus; updatedAt: string };
        if (data.updatedAt !== last.current) {
          last.current = data.updatedAt;
          setAnnouncement(`Order update: ${ORDER_STATUS_LABEL[data.status]}`);
          router.refresh();
        }
      } catch {
        // Offline: try again on the next tick.
      }
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(check, 20_000);
    };
    const onVisibility = () => {
      if (document.hidden) clearInterval(timer);
      else {
        void check();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [orderId, token, status, router]);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );
}
