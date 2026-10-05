import "server-only";
import { z } from "zod";

/**
 * On Vercel the site's own URL comes from system variables, so it doesn't need
 * setting by hand: the production domain in production, the deployment URL on
 * previews. An explicit NEXT_PUBLIC_SHOP_URL / BETTER_AUTH_URL always wins.
 */
function vercelUrl(): string | undefined {
  const host = process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
  return host ? `https://${host}` : undefined;
}
const siteUrl = process.env.NEXT_PUBLIC_SHOP_URL || vercelUrl();

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.url(),
    NEXT_PUBLIC_SHOP_URL: z.url(),
    NEXT_PUBLIC_BRAND_NAME: z.string().min(1).default("Campus Eats"),
    // Optional until the admin site is deployed; without it /api/revalidate refuses every call.
    REVALIDATE_SECRET: z.string().min(32, "REVALIDATE_SECRET must be at least 32 characters").optional(),
    ORDER_LINK_SECRET: z.string().min(32, "ORDER_LINK_SECRET must be at least 32 characters"),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().min(3).default("Campus Eats <onboarding@resend.dev>"),
  })
  ;

const parsed = schema.safeParse({
  ...process.env,
  NEXT_PUBLIC_SHOP_URL: siteUrl,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || siteUrl,
});
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
/** In production without a Resend key, emails are skipped (and logged as errors) instead of printed. */
export const emailEnabled = Boolean(env.RESEND_API_KEY);
if (env.NODE_ENV === "production" && !emailEnabled && process.env.NEXT_PHASE !== "phase-production-build") {
  console.error(JSON.stringify({ level: "error", event: "email_not_configured", message: "RESEND_API_KEY is not set: customer emails are disabled" }));
}
