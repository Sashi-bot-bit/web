"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { z } from "zod";

type Errors = Record<string, string[] | undefined>;

/**
 * Client-side form helper for auth flows (which call Better Auth from the
 * browser so its rate limits and cookies apply). Validates with Zod, then
 * focuses the first invalid field or the message.
 */
export function useClientForm<S extends z.ZodType>(schema: S, read: (fd: FormData) => unknown) {
  const ref = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function focusFirstProblem() {
    requestAnimationFrame(() => {
      const el = ref.current?.querySelector<HTMLElement>("[aria-invalid=true]") ?? ref.current?.querySelector<HTMLElement>("[data-form-message]");
      el?.focus();
    });
  }

  function handle(submit: (data: z.output<S>, form: HTMLFormElement) => Promise<void>) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const result = schema.safeParse(read(new FormData(form)));
      if (!result.success) {
        setErrors(z.flattenError(result.error).fieldErrors as Errors);
        setMessage(null);
        focusFirstProblem();
        return;
      }
      setErrors({});
      setMessage(null);
      startTransition(async () => {
        await submit(result.data, form);
      });
    };
  }

  function fail(text: string) {
    setMessage({ ok: false, text });
    focusFirstProblem();
  }

  return { ref, errors, message, setMessage, fail, pending, handle };
}

export function FormNotice({ message }: { message: { ok: boolean; text: string } | null }) {
  return (
    <div role="status" aria-live="polite">
      {message ? (
        <p
          data-form-message
          tabIndex={-1}
          className={
            message.ok
              ? "rounded-[var(--radius-sm)] border-l-4 border-success bg-success-tint px-3 py-2 text-small font-bold text-success-ink"
              : "rounded-[var(--radius-sm)] border-l-4 border-danger bg-danger-tint px-3 py-2 text-small font-bold text-danger-ink"
          }
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
