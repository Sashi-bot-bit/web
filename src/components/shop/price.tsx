import { formatPence } from "@/shared/money";
import { cn } from "@/components/ui/cn";

export function Price({ pricePence, discountedPricePence, className }: { pricePence: number; discountedPricePence: number | null; className?: string }) {
  if (discountedPricePence == null) return <span className={cn("font-bold tabular", className)}>{formatPence(pricePence)}</span>;
  return (
    <span className={cn("tabular", className)}>
      <span className="sr-only">
        Now {formatPence(discountedPricePence)}, was {formatPence(pricePence)}
      </span>
      <span aria-hidden>
        <span className="font-bold text-accent-ink">{formatPence(discountedPricePence)}</span>{" "}
        <s className="text-muted">{formatPence(pricePence)}</s>
      </span>
    </span>
  );
}
