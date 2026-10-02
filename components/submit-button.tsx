"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./ui";

export function SubmitButton({
  pendingLabel,
  children,
  disabled,
  ...rest
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
