"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/shop/password-field";
import { FormNotice, useClientForm } from "@/components/shop/use-client-form";
import { authClient } from "@/lib/auth-client";
import { safeNext, signInSchema } from "@/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { ref, errors, message, fail, pending, handle } = useClientForm(signInSchema, (fd) => ({
    email: String(fd.get("email") ?? "").trim(),
    password: String(fd.get("password") ?? ""),
  }));

  const onSubmit = handle(async (data) => {
    const { error } = await authClient.signIn.email(data);
    if (error) {
      fail(error.status === 429 ? "Too many attempts. Wait 15 minutes, then try again." : "Email or password is incorrect.");
      return;
    }
    router.replace(next);
    router.refresh();
  });

  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required errors={errors.email} />
      <div>
        <PasswordField name="password" label="Password" autoComplete="current-password" errors={errors.password} />
        <Link href="/forgot-password" className="mt-2 inline-flex min-h-11 items-center text-small font-bold underline underline-offset-4">
          Forgotten your password?
        </Link>
      </div>
      <FormNotice message={message} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
