"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Checkbox, TextField } from "@/components/ui/field";
import { FormNotice } from "@/components/shop/use-client-form";

export function ProfileForm({ defaults }: { defaults: { name: string; phone: string; marketingOptIn: boolean } }) {
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await updateProfileAction({
            name: String(fd.get("name") ?? ""),
            phone: String(fd.get("phone") ?? ""),
            marketingOptIn: fd.get("marketingOptIn") === "on",
          });
          setErrors(result.errors ?? {});
          setMessage({ ok: result.ok, text: result.message });
        });
      }}
    >
      <TextField label="Name" name="name" autoComplete="name" required defaultValue={defaults.name} errors={errors.name} />
      <TextField label="Mobile number" name="phone" type="tel" autoComplete="tel" defaultValue={defaults.phone} hint="Used at checkout so we can reach you at the drop point." errors={errors.phone} />
      <Checkbox label="Email me occasional offers" name="marketingOptIn" defaultChecked={defaults.marketingOptIn} />
      <FormNotice message={message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
