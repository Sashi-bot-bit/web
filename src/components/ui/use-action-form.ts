"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { initialFormState, type FormState } from "@/shared/validation/form";

/**
 * Submits a form to a server action without React's automatic form reset, so
 * a failed save keeps what the user typed. After a failed submit, focus moves
 * to the first invalid field (or the form message) for keyboard and
 * screen-reader users. Optionally clears the form after success.
 */
export function useActionForm(
  action: (prev: FormState, fd: FormData) => Promise<FormState>,
  { resetOnSuccess = false }: { resetOnSuccess?: boolean } = {},
) {
  const [state, dispatch, pending] = useActionState(action, initialFormState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = ref.current;
    if (!form || state === initialFormState) return;
    if (state.ok) {
      if (resetOnSuccess) form.reset();
      return;
    }
    const target = form.querySelector<HTMLElement>("[aria-invalid=true]") ?? form.querySelector<HTMLElement>("[role=status]");
    if (target) {
      if (target.getAttribute("role") === "status" || target.tagName === "FIELDSET") target.setAttribute("tabindex", "-1");
      target.focus();
    }
  }, [state, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    startTransition(() => dispatch(fd));
  }

  return { state, pending, formProps: { ref, onSubmit, noValidate: true } };
}
