import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/shop/auth-shell";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

async function ResetContent({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  if (!token || error) {
    return (
      <div className="space-y-4">
        <p>This reset link has expired or has already been used.</p>
        <Link href="/forgot-password" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
          Send a new link
        </Link>
      </div>
    );
  }
  return <ResetForm token={token} />;
}

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  return (
    <AuthShell title="Choose a new password">
      <Suspense>
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
