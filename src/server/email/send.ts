import "server-only";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { db } from "../db";
import { env } from "../env";
import { log } from "../log";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

type SendInput = {
  to: string;
  subject: string;
  email: ReactElement;
  /** e.g. "order:{id}:CONFIRMED". When set, the email is sent at most once. */
  dedupeKey?: string;
  type: string;
};

/**
 * Sends a transactional email through Resend. Without RESEND_API_KEY (allowed
 * only outside production, enforced in env.ts) the email is printed to the
 * server console so links can be followed locally.
 */
export async function sendEmail({ to, subject, email, dedupeKey, type }: SendInput): Promise<boolean> {
  if (dedupeKey) {
    const existing = await db.emailLog.findUnique({ where: { dedupeKey } });
    if (existing) return true;
  }
  const [html, text] = await Promise.all([render(email), render(email, { plainText: true })]);

  let providerId: string | null = null;
  let status = "sent";
  if (resend) {
    const { data, error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html, text });
    if (error) {
      log.error("email_send_failed", { type, error: { name: error.name, message: error.message } });
      status = "failed";
    } else {
      providerId = data?.id ?? null;
    }
  } else if (env.NODE_ENV === "production") {
    log.error("email_skipped_not_configured", { type });
    return false;
  } else {
    status = "logged";
    console.info(`\n──── email (${type}) ────\nSubject: ${subject}\n${text}\n────────────────\n`);
  }

  if (dedupeKey && status !== "failed") {
    await db.emailLog.create({ data: { dedupeKey, type, toEmail: to, providerId, status } }).catch(() => undefined);
  }
  return status !== "failed";
}
