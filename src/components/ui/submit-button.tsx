"use client";

import type { ComponentProps } from "react";
import { Button } from "./button";

export function SubmitButton({
  children,
  pending,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean; pendingLabel?: string }) {
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-disabled={pending} {...props}>
      {pending ? (pendingLabel ?? "Saving…") : children}
    </Button>
  );
}
