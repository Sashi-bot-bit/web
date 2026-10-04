import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { ResetPasswordEmail, VerifyEmail } from "@/shared/emails/auth";
import { db } from "./db";
import { sendEmail } from "./email/send";
import { env } from "./env";

const brand = env.NEXT_PUBLIC_BRAND_NAME;

/**
 * Customer auth for the shop. Roles are never accepted from sign-up input
 * (the field isn't declared), so every new account is a CUSTOMER. Admin
 * accounts can't sign in here: they use the separate admin site.
 */
export const auth = betterAuth({
  appName: brand,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        type: "reset_password",
        email: <ResetPasswordEmail brand={brand} name={user.name} url={url} />,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Confirm your email address",
        type: "verify_email",
        email: <VerifyEmail brand={brand} name={user.name} url={url} />,
      });
    },
  },
  user: {
    additionalFields: {
      // PECR: marketing consent is opt-in and unticked by default.
      marketingOptIn: { type: "boolean", required: false, defaultValue: false, input: true },
      // Set by the server only (input: false), recorded as evidence of consent.
      marketingOptInAt: { type: "date", required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
      "/request-password-reset": { window: 60 * 60, max: 3 },
      "/send-verification-email": { window: 60 * 60, max: 3 },
    },
  },
  advanced: {
    cookiePrefix: "ce",
    useSecureCookies: env.NODE_ENV === "production",
    // Vercel sets these from the connecting client; they can't be forged through the edge.
    ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for", "x-real-ip"] },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, email: user.email.trim().toLowerCase(), marketingOptInAt: user.marketingOptIn ? new Date() : null },
        }),
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({ where: { id: session.userId }, select: { role: true, anonymisedAt: true } });
          if (!user || user.role !== "CUSTOMER" || user.anonymisedAt) return false;
          return { data: session };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
