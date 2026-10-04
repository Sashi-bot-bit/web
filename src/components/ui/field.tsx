import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

const control =
  "block w-full min-h-11 rounded-[var(--radius-sm)] border border-border-strong bg-bg px-3 py-2 text-body text-ink placeholder:text-muted aria-[invalid=true]:border-danger-ink aria-[invalid=true]:border-2";

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-1 text-small font-bold text-danger-ink">
      {errors[0]}
    </p>
  );
}

type BaseProps = { label: string; name: string; hint?: ReactNode; errors?: string[]; className?: string };

function describedBy(name: string, hint?: ReactNode, errors?: string[]) {
  return [hint ? `${name}-hint` : null, errors?.length ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function TextField({
  label,
  name,
  hint,
  errors,
  className,
  ...input
}: BaseProps & Omit<ComponentProps<"input">, "name">) {
  return (
    <div className={className}>
      <label htmlFor={input.id ?? name} className="mb-1 block text-small font-bold text-ink">
        {label}
        {input.required ? null : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {hint ? (
        <p id={`${name}-hint`} className="mb-1 text-small text-muted">
          {hint}
        </p>
      ) : null}
      <input
        id={input.id ?? name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(name, hint, errors)}
        className={control}
        {...input}
      />
      <FieldError id={`${name}-error`} errors={errors} />
    </div>
  );
}

export function TextArea({
  label,
  name,
  hint,
  errors,
  className,
  ...input
}: BaseProps & Omit<ComponentProps<"textarea">, "name">) {
  return (
    <div className={className}>
      <label htmlFor={input.id ?? name} className="mb-1 block text-small font-bold text-ink">
        {label}
        {input.required ? null : <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {hint ? (
        <p id={`${name}-hint`} className="mb-1 text-small text-muted">
          {hint}
        </p>
      ) : null}
      <textarea
        id={input.id ?? name}
        name={name}
        rows={3}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(name, hint, errors)}
        className={cn(control, "min-h-24")}
        {...input}
      />
      <FieldError id={`${name}-error`} errors={errors} />
    </div>
  );
}

export function SelectField({
  label,
  name,
  hint,
  errors,
  className,
  children,
  ...input
}: BaseProps & Omit<ComponentProps<"select">, "name">) {
  return (
    <div className={className}>
      <label htmlFor={input.id ?? name} className="mb-1 block text-small font-bold text-ink">
        {label}
      </label>
      {hint ? (
        <p id={`${name}-hint`} className="mb-1 text-small text-muted">
          {hint}
        </p>
      ) : null}
      <select
        id={input.id ?? name}
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(name, hint, errors)}
        className={control}
        {...input}
      >
        {children}
      </select>
      <FieldError id={`${name}-error`} errors={errors} />
    </div>
  );
}

export function Checkbox({
  label,
  name,
  hint,
  errors,
  className,
  ...input
}: Omit<BaseProps, "label"> & { label: ReactNode } & Omit<ComponentProps<"input">, "name" | "type">) {
  const id = input.id ?? `${name}-${String(input.value ?? "on")}`;
  return (
    <div className={className}>
      <div className="flex min-h-11 items-start gap-3 py-2">
        <input
          type="checkbox"
          id={id}
          name={name}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={describedBy(name, hint, errors)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-accent)]"
          {...input}
        />
        <label htmlFor={id} className="text-body leading-6">
          {label}
          {hint ? (
            <span id={`${name}-hint`} className="block text-small text-muted">
              {hint}
            </span>
          ) : null}
        </label>
      </div>
      <FieldError id={`${name}-error`} errors={errors} />
    </div>
  );
}

export function Fieldset({
  legend,
  hint,
  errors,
  name,
  children,
  className,
}: {
  legend: string;
  hint?: ReactNode;
  errors?: string[];
  name: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      className={cn("min-w-0", className)}
      aria-describedby={describedBy(name, hint, errors)}
      aria-invalid={errors?.length ? true : undefined}
    >
      <legend className="mb-1 text-small font-bold text-ink">{legend}</legend>
      {hint ? (
        <p id={`${name}-hint`} className="mb-2 text-small text-muted">
          {hint}
        </p>
      ) : null}
      {children}
      <FieldError id={`${name}-error`} errors={errors} />
    </fieldset>
  );
}
