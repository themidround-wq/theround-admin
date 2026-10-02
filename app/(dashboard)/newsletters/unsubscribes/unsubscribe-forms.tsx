"use client";

import { addUnsubscribe, removeUnsubscribe } from "@/app/actions/newsletters";
import { ActionForm, ConfirmSubmit } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { inputClass } from "@/components/ui";

export function AddUnsubscribe() {
  return (
    <ActionForm action={addUnsubscribe} resetOnSuccess className="flex gap-2 p-5 pt-3">
      <input name="email" type="email" required placeholder="name@example.com" aria-label="Email to unsubscribe" className={inputClass} />
      <SubmitButton variant="primary" pendingLabel="Saving…">
        Unsubscribe
      </SubmitButton>
    </ActionForm>
  );
}

export function Resubscribe({ email }: { email: string }) {
  return (
    <ActionForm action={removeUnsubscribe}>
      <input type="hidden" name="email" value={email} />
      <ConfirmSubmit variant="ghost" prompt="Only if they asked to be resubscribed." confirmLabel="Resubscribe">
        Resubscribe
      </ConfirmSubmit>
    </ActionForm>
  );
}
