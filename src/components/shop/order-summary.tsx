import { formatPence } from "@/shared/money";
import { formatBasisPoints } from "@/shared/fees";

type Fee = { id?: string | null; label: string; type?: string; basisPoints?: number | null; chargedPence: number };

/** Itemised totals: every fee on its own line, no hidden charges. */
export function OrderSummary({ subtotalPence, fees, totalPence, totalLabel = "Total" }: { subtotalPence: number; fees: Fee[]; totalPence: number; totalLabel?: string }) {
  return (
    <dl className="space-y-1.5 tabular">
      <div className="flex justify-between gap-4">
        <dt>Items</dt>
        <dd>{formatPence(subtotalPence)}</dd>
      </div>
      {fees.map((f, i) => (
        <div key={f.id ?? `${f.label}-${i}`} className="flex justify-between gap-4">
          <dt>
            {f.label}
            {f.type === "PERCENT" && f.basisPoints != null ? <span className="text-muted"> ({formatBasisPoints(f.basisPoints)})</span> : null}
          </dt>
          <dd>{formatPence(f.chargedPence)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-border pt-2.5 text-h3 font-bold">
        <dt>{totalLabel}</dt>
        <dd>{formatPence(totalPence)}</dd>
      </div>
    </dl>
  );
}
