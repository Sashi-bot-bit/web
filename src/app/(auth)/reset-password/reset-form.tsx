"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/shop/password-field";
import { FormNotice, useClientForm } from "@/components/shop/use-client-form";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MIN, resetSchema } from "@/lib/validation/auth";

export function ResetForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const { ref, errors, message, fail, pending, handle } = useClientForm(resetSchema, (fd) => ({
    password: String(fd.get("password") ?? ""),
    confirm: String(fd.get("confirm") ?? ""),
  }));

  const onSubmit = handle(async ({ password }) => {
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) return fail("This reset link has expired or has already been used. Request a new one.");
    setDone(true);
  });

  if (done) {
    return (
      <div role="status" className="space-y-4">
        <p className="font-bold">Your password has been changed.</p>
        <p className="text-muted">For your security, you’ve been signed out on all devices.</p>
        <Link href="/login" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="space-y-5">
      <PasswordField name="password" label="New password" autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters.`} errors={errors.password} />
      <PasswordField name="confirm" label="Confirm new password" autoComplete="new-password" errors={errors.confirm} />
      <FormNotice message={message} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
