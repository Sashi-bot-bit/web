import { Flame } from "lucide-react";
import type { Allergen } from "@/generated/prisma/enums";
import { ALLERGENS_NOT_PROVIDED, allergenLabel } from "@/shared/allergens";

export function DietaryBadges({ tags }: { tags: { slug: string; label: string }[] }) {
  if (!tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Dietary">
      {tags.map((t) => (
        <li key={t.slug} className="rounded-[var(--radius-sm)] border border-border-strong px-1.5 py-px text-[0.75rem] font-bold leading-5">
          {t.label}
        </li>
      ))}
    </ul>
  );
}

export function Spice({ level }: { level: number }) {
  if (level <= 0) return null;
  const label = ["", "Mild", "Medium", "Hot"][level] ?? "Hot";
  return (
    <span className="inline-flex items-center gap-0.5 text-small text-danger-ink" title={`${label} spice`}>
      {Array.from({ length: level }, (_, i) => (
        <Flame key={i} aria-hidden className="size-3.5" strokeWidth={2} />
      ))}
      <span className="sr-only">{label} spice</span>
    </span>
  );
}

/** Allergen block: always visible, never collapsed (UK distance-selling rules). */
export function AllergenInfo({
  allergens,
  mayContain,
  noAllergens,
  compact = false,
}: {
  allergens: (Allergen | string)[];
  mayContain: (Allergen | string)[];
  noAllergens: boolean;
  compact?: boolean;
}) {
  const contains = allergens.map((a) => allergenLabel(a as Allergen));
  const traces = mayContain.map((a) => allergenLabel(a as Allergen));
  const notProvided = contains.length === 0 && !noAllergens;
  if (compact) {
    return (
      <p className="text-small text-muted">
        <span className="font-bold text-ink">Contains:</span>{" "}
        {contains.length ? contains.join(", ") : noAllergens ? "none of the 14 allergens" : "not provided by the restaurant"}
        {traces.length ? (
          <>
            {" "}
            · <span className="font-bold text-ink">May contain:</span> {traces.join(", ")}
          </>
        ) : null}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <div>
        <p className="text-small font-bold">Contains</p>
        {contains.length ? (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {contains.map((a) => (
              <li key={a} className="rounded-[var(--radius-sm)] bg-warn px-2 py-0.5 text-small font-bold text-ink">
                {a}
              </li>
            ))}
          </ul>
        ) : notProvided ? (
          <p className="mt-1 text-small font-bold">{ALLERGENS_NOT_PROVIDED}</p>
        ) : (
          <p className="mt-1 text-small">None of the 14 major allergens</p>
        )}
      </div>
      {traces.length ? (
        <div>
          <p className="text-small font-bold">May contain traces of</p>
          <p className="mt-1 text-small">{traces.join(", ")}</p>
        </div>
      ) : null}
    </div>
  );
}
