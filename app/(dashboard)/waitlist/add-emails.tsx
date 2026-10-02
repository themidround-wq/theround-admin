"use client";

import { useState } from "react";
import { addToWaitlist } from "@/app/actions/admin";
import { ActionForm } from "@/components/action-form";
import { PlusIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui";
import { Dialog } from "@/components/dialog";

export function AddEmails() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" /> Add emails
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add to the waitlist">
        <ActionForm action={addToWaitlist} onSuccess={() => setOpen(false)}>
          <p className="text-sm text-muted">
            Paste emails separated by commas, spaces or new lines. Anyone already on the list is skipped. No confirmation email
            is sent.
          </p>
          <textarea
            name="emails"
            required
            rows={6}
            autoFocus
            placeholder={"nkem@example.com\nada@example.com"}
            className="mt-3 w-full rounded-lg border border-line p-3 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/15"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton variant="primary" pendingLabel="Adding…">
              Add to waitlist
            </SubmitButton>
          </div>
        </ActionForm>
      </Dialog>
    </>
  );
}
