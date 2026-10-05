import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Reads the real token values from globals.css so a token edit that breaks contrast fails CI. */
const css = readFileSync(new URL("../../src/app/globals.css", import.meta.url), "utf8");
const token = (name: string) => {
  const m = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!m) throw new Error(`Missing token --color-${name}`);
  return m[1];
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum ratio] — 4.5 for text, 3 for non-text UI.
const PAIRS: [string, string, number][] = [
  ["ink", "bg", 4.5],
  ["ink-2", "bg", 4.5],
  ["muted", "bg", 4.5],
  ["muted", "surface", 4.5],
  ["on-accent", "accent", 4.5],
  ["on-accent", "accent-hover", 4.5],
  ["on-accent", "accent-press", 4.5],
  ["accent", "bg", 4.5],
  ["accent-ink", "accent-tint", 4.5],
  ["danger-ink", "bg", 4.5],
  ["danger-ink", "danger-tint", 4.5],
  ["success-ink", "bg", 4.5],
  ["success-ink", "success-tint", 4.5],
  ["ink", "warn-tint", 4.5],
  ["ink", "info", 4.5],
  ["ink", "warn", 4.5],
  ["ink", "success", 4.5],
  ["ink", "danger", 4.5],
  ["ink", "attention", 4.5],
  ["ink", "surface-2", 4.5],
  ["on-dark", "ink", 4.5],
  ["on-dark-muted", "ink", 4.5],
  ["accent-on-dark", "ink", 4.5],
  ["ink-2", "warn-tint", 4.5],
  ["accent-ink", "bg", 4.5],
  ["accent-ink", "surface", 4.5],
  ["orange-ink", "orange-tint", 4.5],
  ["orange-ink", "bg", 4.5],
  ["success-ink", "green-tint", 4.5],
  ["ink-2", "green-tint", 4.5],
  ["ink-2", "pink-tint", 4.5],
  ["accent-ink", "pink-tint", 4.5],
  ["muted", "warn-tint", 4.5],
  ["accent", "bg", 4.5], // highlighted headline word
  ["border-strong", "bg", 3],
  ["border-strong", "surface", 3],
  ["accent", "bg", 3], // focus ring
];

describe("design token contrast (WCAG 2.2 AA)", () => {
  it.each(PAIRS)("%s on %s ≥ %d:1", (fg, bg, min) => {
    expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(min);
  });

  it("never uses bright secondaries as text on white", () => {
    for (const name of ["info", "warn", "success", "danger", "attention"]) {
      expect(contrast(token(name), token("bg"))).toBeLessThan(4.5);
    }
  });
});
