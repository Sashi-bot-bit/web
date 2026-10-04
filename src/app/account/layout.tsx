import { Suspense } from "react";
import { AccountNav } from "./account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8">
      <h1 className="text-h1 font-bold">Your account</h1>
      <div className="mt-4">
        <Suspense>
          <AccountNav />
        </Suspense>
      </div>
      <div className="pt-6">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-surface" />}>{children}</Suspense>
      </div>
    </div>
  );
}
