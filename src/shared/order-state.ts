import type { ActorType, OrderStatus } from "@/generated/prisma/enums";

/**
 * Order lifecycle for pay-on-delivery.
 *   CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED
 *   IN_TRANSIT → NOT_COLLECTED
 *   CONFIRMED | PREPARING | IN_TRANSIT → CANCELLED
 */
const ADMIN_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  CONFIRMED: ["PREPARING", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
  PREPARING: ["IN_TRANSIT", "DELIVERED", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "NOT_COLLECTED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  NOT_COLLECTED: [],
};

export const TERMINAL_STATUSES: readonly OrderStatus[] = ["DELIVERED", "CANCELLED", "NOT_COLLECTED"];

/** Statuses that hold slot capacity. */
export const CAPACITY_HOLDING_STATUSES: readonly OrderStatus[] = [
  "CONFIRMED",
  "PREPARING",
  "IN_TRANSIT",
  "DELIVERED",
  "NOT_COLLECTED",
];

export type TransitionContext = {
  /** Required for customer cancellations: the instant ordering closes for the order's slot. */
  orderClosesAt?: Date;
  now?: Date;
};

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: ActorType,
  ctx: TransitionContext = {},
): boolean {
  if (from === to) return false;
  if (actor === "ADMIN" || actor === "SYSTEM") return ADMIN_TRANSITIONS[from].includes(to);
  // Customers may only cancel a confirmed order before the ordering cutoff.
  if (actor === "CUSTOMER") {
    if (from !== "CONFIRMED" || to !== "CANCELLED") return false;
    if (!ctx.orderClosesAt) return false;
    return (ctx.now ?? new Date()).getTime() < ctx.orderClosesAt.getTime();
  }
  return false;
}

/** The Order timestamp column set when entering a status. */
export function timestampFieldFor(status: OrderStatus) {
  switch (status) {
    case "PREPARING":
      return "preparingAt" as const;
    case "IN_TRANSIT":
      return "inTransitAt" as const;
    case "DELIVERED":
      return "deliveredAt" as const;
    case "CANCELLED":
      return "cancelledAt" as const;
    case "NOT_COLLECTED":
      return "notCollectedAt" as const;
    case "CONFIRMED":
      return "placedAt" as const;
  }
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  IN_TRANSIT: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  NOT_COLLECTED: "Not collected",
};
