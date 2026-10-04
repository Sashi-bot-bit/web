"use client";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { FormNotice, useClientForm } from "@/components/shop/use-client-form";
import { authClient } from "@/lib/auth-client";
import { forgotSchema } from "@/lib/validation/auth";

export function ForgotForm() {
  const { ref, errors, message, setMessage, fail, pending, handle } = useClientForm(forgotSchema, (fd) => ({
    email: String(fd.get("email") ?? "").trim(),
  }));

  const onSubmit = handle(async ({ email }, form) => {
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    if (error?.status === 429) return fail("Too many requests. Try again in an hour.");
    // Same message whether or not the account exists, so emails can't be probed.
    setMessage({ ok: true, text: "If an account exists for that email, a reset link is on its way. Check your inbox and spam folder." });
    form.reset();
  });

  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required errors={errors.email} />
      <FormNotice message={message} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
