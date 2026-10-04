import type { Metadata } from "next";
import { AuthShell } from "@/components/shop/auth-shell";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" intro="Enter your account email and we’ll send you a link to choose a new password.">
      <ForgotForm />
    </AuthShell>
  );
}
