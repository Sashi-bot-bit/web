import { z } from "zod";

export const PASSWORD_MIN = 10;

const email = z.email({ error: "Enter a valid email address, like name@example.com" }).max(254);
const newPassword = z
  .string()
  .min(PASSWORD_MIN, `Use at least ${PASSWORD_MIN} characters`)
  .max(128, "Use 128 characters or fewer");

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80, "Use 80 characters or fewer"),
  email,
  password: newPassword,
  marketingOptIn: z.boolean(),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don’t match" });

/** Only same-site relative paths, never protocol-relative or API routes. */
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/api")) return fallback;
  return value;
}
