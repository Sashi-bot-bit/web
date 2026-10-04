import { CheckCircle2, CircleSlash, Clock, TimerReset } from "lucide-react";
import type { SlotStatus } from "@/shared/slots";
import type { OrderStatus } from "@/generated/prisma/enums";
import { ORDER_STATUS_LABEL } from "@/shared/order-state";
import { Chip } from "@/components/ui/chip";

export function SlotChip({ status }: { status: SlotStatus }) {
  switch (status) {
    case "OPEN":
      return (
        <Chip tone="success">
          <CheckCircle2 aria-hidden className="size-3.5" /> Open
        </Chip>
      );
    case "CLOSING_SOON":
      return (
        <Chip tone="warn">
          <TimerReset aria-hidden className="size-3.5" /> Closing soon
        </Chip>
      );
    case "FULL":
      return (
        <Chip tone="danger">
          <CircleSlash aria-hidden className="size-3.5" /> Full
        </Chip>
      );
    case "UPCOMING":
      return (
        <Chip tone="neutral">
          <Clock aria-hidden className="size-3.5" /> Opens soon
        </Chip>
      );
    default:
      return <Chip tone="neutral">Closed</Chip>;
  }
}

const ORDER_TONE: Record<OrderStatus, "info" | "attention" | "accent" | "success" | "outline" | "danger"> = {
  CONFIRMED: "info",
  PREPARING: "attention",
  IN_TRANSIT: "accent",
  DELIVERED: "success",
  CANCELLED: "outline",
  NOT_COLLECTED: "danger",
};

export function OrderChip({ status }: { status: OrderStatus }) {
  return <Chip tone={ORDER_TONE[status]}>{ORDER_STATUS_LABEL[status]}</Chip>;
}
