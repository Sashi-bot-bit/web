import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/shop/auth-shell";

export const metadata: Metadata = { title: "Email confirmation" };

async function Result({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (error) {
    return (
      <div className="space-y-4">
        <p>This confirmation link has expired or has already been used.</p>
        <p className="text-muted">Sign in and request a new link from your account page.</p>
        <Link href="/account" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
          Go to your account
        </Link>
      </div>
    );
  }
  return (
    <div role="status" className="space-y-4">
      <p className="font-bold">Thanks, your email address is confirmed.</p>
      <Link href="/" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">
        Start an order
      </Link>
    </div>
  );
}

export default function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <AuthShell title="Email confirmation">
      <Suspense>
        <Result searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}
