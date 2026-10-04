import type { FormState } from "@/shared/validation/form";
import { cn } from "./cn";

/** Form-level result, announced politely to screen readers. */
export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      {state.message ? (
        <p
          className={cn(
            "rounded-[var(--radius-sm)] border-l-4 px-3 py-2 text-small font-bold",
            state.ok ? "border-success bg-success-tint text-success-ink" : "border-danger bg-danger-tint text-danger-ink",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
