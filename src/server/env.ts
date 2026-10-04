import "server-only";
import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.url(),
    NEXT_PUBLIC_SHOP_URL: z.url(),
    NEXT_PUBLIC_BRAND_NAME: z.string().min(1).default("Campus Eats"),
    REVALIDATE_SECRET: z.string().min(32, "REVALIDATE_SECRET must be at least 32 characters"),
    ORDER_LINK_SECRET: z.string().min(32, "ORDER_LINK_SECRET must be at least 32 characters"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().min(3).default("Campus Eats <onboarding@resend.dev>"),
  })
  ;

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
/** In production without a Resend key, emails are skipped (and logged as errors) instead of printed. */
export const emailEnabled = Boolean(env.RESEND_API_KEY);
if (env.NODE_ENV === "production" && !emailEnabled) {
  console.error(JSON.stringify({ level: "error", event: "email_not_configured", message: "RESEND_API_KEY is not set: customer emails are disabled" }));
}
