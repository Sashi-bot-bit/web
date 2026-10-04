"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { FormNotice } from "@/components/shop/use-client-form";

export function DeleteAccount() {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      noValidate
      className="mt-4 max-w-sm space-y-4 rounded-[var(--radius-md)] border border-danger-ink p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const value = String(new FormData(e.currentTarget).get("confirm") ?? "");
        startTransition(async () => {
          const result = await deleteAccountAction(value);
          setMessage({ ok: result.ok, text: result.message });
          if (result.ok) {
            router.replace("/");
            router.refresh();
          }
        });
      }}
    >
      <TextField label="Type DELETE to confirm" name="confirm" autoComplete="off" required />
      <FormNotice message={message} />
      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? "Deleting…" : "Delete my account"}
      </Button>
    </form>
  );
}
