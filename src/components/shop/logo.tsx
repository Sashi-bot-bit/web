import { UtensilsCrossed } from "lucide-react";

/** Brand lock-up: icon tile + two-tone wordmark + tagline. */
export function Logo({ brand, compact = false }: { brand: string; compact?: boolean }) {
  const [first, ...rest] = brand.split(" ");
  return (
    <span className="flex items-center gap-2.5">
      <span aria-hidden className="flex size-9 items-center justify-center rounded-[10px] bg-accent text-on-accent">
        <UtensilsCrossed className="size-5" strokeWidth={2.25} />
      </span>
      <span className="leading-none">
        <span className="block text-[1.125rem] font-bold tracking-[-0.01em] uppercase">
          {first}
          {rest.length ? <span className="text-accent"> {rest.join(" ")}</span> : null}
        </span>
        {compact ? null : <span className="mt-1 block text-[0.625rem] font-medium tracking-[0.04em] text-muted uppercase">Campus food, made easy</span>}
      </span>
    </span>
  );
}
