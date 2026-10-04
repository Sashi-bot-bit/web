"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTicketAction } from "@/server/actions/support";
import { Button } from "@/components/ui/button";
import { SelectField, TextArea, TextField } from "@/components/ui/field";
import { FormNotice } from "@/components/shop/use-client-form";

export function TicketForm({
  customer,
  orders,
  preselectedOrderId,
  orderToken,
}: {
  customer: { name: string; email: string } | null;
  orders: { id: string; number: string }[];
  preselectedOrderId: string | null;
  orderToken: string | null;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          const result = await createTicketAction(
            {
              subject: String(fd.get("subject") ?? ""),
              message: String(fd.get("message") ?? ""),
              orderId: String(fd.get("orderId") ?? ""),
              name: String(fd.get("name") ?? ""),
              email: String(fd.get("email") ?? ""),
            },
            orderToken,
          );
          setErrors(result.errors ?? {});
          if (result.ok && result.path) {
            router.push(result.path);
            return;
          }
          setMessage({ ok: result.ok, text: result.message });
          requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
        });
      }}
    >
      {customer ? null : (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" name="name" autoComplete="name" required errors={errors.name} />
          <TextField label="Email" name="email" type="email" autoComplete="email" required hint="We’ll reply here." errors={errors.email} />
        </div>
      )}
      {orders.length ? (
        <SelectField label="Which order is this about?" name="orderId" defaultValue={preselectedOrderId ?? ""}>
          <option value="">Not about a specific order</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              Order {o.number}
            </option>
          ))}
        </SelectField>
      ) : null}
      <TextField label="Subject" name="subject" required maxLength={120} errors={errors.subject} />
      <TextArea label="Message" name="message" required rows={6} maxLength={4000} errors={errors.message} />
      <FormNotice message={message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
