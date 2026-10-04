"use client";

import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/shop/password-field";
import { FormNotice, useClientForm } from "@/components/shop/use-client-form";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MIN } from "@/lib/validation/auth";

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    password: z.string().min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`).max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don’t match" });

export function ChangePasswordForm() {
  const { ref, errors, message, setMessage, fail, pending, handle } = useClientForm(schema, (fd) => ({
    current: String(fd.get("current") ?? ""),
    password: String(fd.get("password") ?? ""),
    confirm: String(fd.get("confirm") ?? ""),
  }));
  const onSubmit = handle(async (data, form) => {
    const { error } = await authClient.changePassword({ currentPassword: data.current, newPassword: data.password, revokeOtherSessions: true });
    if (error) return fail(error.status === 429 ? "Too many attempts. Try again later." : "Your current password is incorrect.");
    form.reset();
    setMessage({ ok: true, text: "Password changed. Other devices have been signed out." });
  });
  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="max-w-sm space-y-5">
      <PasswordField name="current" label="Current password" autoComplete="current-password" errors={errors.current} />
      <PasswordField name="password" label="New password" autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters.`} errors={errors.password} />
      <PasswordField name="confirm" label="Confirm new password" autoComplete="new-password" errors={errors.confirm} />
      <FormNotice message={message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
