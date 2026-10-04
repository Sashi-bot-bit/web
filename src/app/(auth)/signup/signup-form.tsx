"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox, TextField } from "@/components/ui/field";
import { PasswordField } from "@/components/shop/password-field";
import { FormNotice, useClientForm } from "@/components/shop/use-client-form";
import { authClient } from "@/lib/auth-client";
import { PASSWORD_MIN, safeNext, signUpSchema } from "@/lib/validation/auth";

export function SignupForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"), "/account?welcome=1");
  const { ref, errors, message, fail, pending, handle } = useClientForm(signUpSchema, (fd) => ({
    name: String(fd.get("name") ?? ""),
    email: String(fd.get("email") ?? "").trim(),
    password: String(fd.get("password") ?? ""),
    marketingOptIn: fd.get("marketingOptIn") === "on",
  }));

  const onSubmit = handle(async (data) => {
    const { error } = await authClient.signUp.email({ ...data, callbackURL: "/verify-email" });
    if (error) {
      if (error.status === 429) return fail("Too many attempts. Try again in an hour.");
      if (error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        return fail("An account with this email already exists. Sign in, or reset your password.");
      }
      if (error.code === "PASSWORD_TOO_SHORT") return fail(`Use at least ${PASSWORD_MIN} characters for your password.`);
      return fail("We couldn’t create your account. Check your details and try again.");
    }
    router.replace(next);
    router.refresh();
  });

  return (
    <form ref={ref} onSubmit={onSubmit} noValidate className="space-y-5">
      <TextField label="Name" name="name" autoComplete="name" required maxLength={80} errors={errors.name} />
      <TextField label="Email" name="email" type="email" autoComplete="email" inputMode="email" required errors={errors.email} />
      <PasswordField name="password" label="Password" autoComplete="new-password" hint={`At least ${PASSWORD_MIN} characters.`} errors={errors.password} />
      <Checkbox
        label="Email me occasional offers"
        name="marketingOptIn"
        hint="Optional. You can change this any time in your account."
      />
      <FormNotice message={message} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
