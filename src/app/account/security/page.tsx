import type { Metadata } from "next";
import { requireCustomerPage } from "@/server/require-customer";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "Password", robots: { index: false } };

export default async function SecurityPage() {
  await requireCustomerPage("/account/security");
  return (
    <>
      <h2 className="text-h2 font-bold">Change password</h2>
      <p className="mt-1 mb-6 text-small text-muted">You’ll stay signed in here. Other devices are signed out.</p>
      <ChangePasswordForm />
    </>
  );
}
