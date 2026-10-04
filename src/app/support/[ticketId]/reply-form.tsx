"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { replyTicketAction } from "@/server/actions/support";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/field";
import { FormNotice } from "@/components/shop/use-client-form";

export function ReplyForm({ ticketId, token, resolved }: { ticketId: string; token: string | null; resolved: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const text = String(new FormData(form).get("message") ?? "");
        startTransition(async () => {
          const result = await replyTicketAction(ticketId, token, { message: text });
          setMessage({ ok: result.ok, text: result.message });
          if (result.ok) {
            form.reset();
            router.refresh();
          }
        });
      }}
    >
      <TextArea label={resolved ? "Reply to reopen this conversation" : "Reply"} name="message" required rows={4} maxLength={4000} />
      <FormNotice message={message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reply"}
      </Button>
    </form>
  );
}
