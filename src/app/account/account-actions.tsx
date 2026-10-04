"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormNotice } from "@/components/shop/use-client-form";
import { authClient } from "@/lib/auth-client";

export function AccountActions({ email, verified }: { email: string; verified: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-10 space-y-4 border-t border-border pt-6">
      {verified ? null : (
        <div className="space-y-3 rounded-[var(--radius-md)] bg-warn-tint p-4">
          <p>Confirm your email so we can link guest orders to your account.</p>
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/verify-email" });
                setMessage(
                  error
                    ? { ok: false, text: error.status === 429 ? "Too many requests. Try again later." : "We couldn’t send the email. Try again." }
                    : { ok: true, text: "Confirmation email sent. Check your inbox." },
                );
              })
            }
          >
            Resend confirmation email
          </Button>
          <FormNotice message={message} />
        </div>
      )}
      <Button
        variant="secondary"
        onClick={async () => {
          await authClient.signOut();
          router.replace("/");
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
