"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FieldError } from "@/components/ui/field";

/** Password input with a show/hide toggle (WCAG 3.3.8 friendly: paste allowed, no puzzles). */
export function PasswordField({
  name,
  label,
  autoComplete,
  hint,
  errors,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  errors?: string[];
}) {
  const [visible, setVisible] = useState(false);
  const describedBy = [hint ? `${name}-hint` : null, errors?.length ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-small font-bold">
        {label}
      </label>
      {hint ? (
        <p id={`${name}-hint`} className="mb-1 text-small text-muted">
          {hint}
        </p>
      ) : null}
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={describedBy}
          className="block min-h-11 w-full rounded-[var(--radius-sm)] border border-border-strong bg-bg py-2 pr-12 pl-3 text-body aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger-ink"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-2 hover:text-ink"
        >
          {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          <span className="sr-only">{visible ? "Hide password" : "Show password"}</span>
        </button>
      </div>
      <FieldError id={`${name}-error`} errors={errors} />
    </div>
  );
}
