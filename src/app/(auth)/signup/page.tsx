import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/shop/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create an account"
      intro={
        <>
          Save your details, see past orders and reorder in a tap. Already have an account?{" "}
          <Link href="/login" className="font-bold text-ink underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
