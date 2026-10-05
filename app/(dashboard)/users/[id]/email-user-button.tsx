"use client";

import { useTransition } from "react";
import { createDirectBroadcast } from "@/app/actions/newsletters";
import { MailIcon } from "@/components/icons";
import { Button } from "@/components/ui";

export function EmailUserButton({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => createDirectBroadcast(email, name))}
    >
      <MailIcon className="h-4 w-4" /> {pending ? "Opening…" : "Email user"}
    </Button>
  );
}
