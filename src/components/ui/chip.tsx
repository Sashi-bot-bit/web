import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "info" | "warn" | "success" | "danger" | "attention" | "accent" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink",
  info: "bg-info text-ink",
  warn: "bg-warn text-ink",
  success: "bg-success text-ink",
  danger: "bg-danger text-ink",
  attention: "bg-attention text-ink",
  accent: "bg-accent text-on-accent",
  outline: "border border-border-strong text-ink",
};

/** Status chip. Always pair colour with a text label (never colour alone). */
export function Chip({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-0.5 text-small font-bold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
