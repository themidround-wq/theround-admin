"use client";

import Link from "next/link";
import { broadcastAction } from "@/app/actions/newsletters";
import { ActionForm, ConfirmSubmit } from "@/components/action-form";
import { CopyIcon, EditIcon, TrashIcon, XIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { buttonClass } from "@/components/ui";
import type { Broadcast } from "@/lib/types";

export function BroadcastRowActions({
  broadcast: b,
  editable,
}: {
  broadcast: Broadcast;
  editable: boolean;
}) {
  const isEditable = b.status === "draft" || b.status === "scheduled";
  const isScheduled = b.status === "scheduled";
  const isSending = b.status === "sending";

  return (
    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
      <Link
        href={`/newsletters/${b.id}`}
        className={buttonClass("secondary", "sm")}
        title={isEditable ? "Edit newsletter" : "View delivery report"}
      >
        <EditIcon className="h-3.5 w-3.5" />
        <span>{isEditable ? "Edit" : "View"}</span>
      </Link>

      {editable && (
        <>
          <ActionForm action={broadcastAction}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="op" value="duplicate" />
            <SubmitButton
              size="sm"
              variant="ghost"
              pendingLabel="Copying…"
              title="Duplicate as new draft"
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </SubmitButton>
          </ActionForm>

          {(isScheduled || isSending) && (
            <ActionForm action={broadcastAction}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="op" value="cancel" />
              <ConfirmSubmit
                size="sm"
                variant="ghost"
                prompt={
                  isScheduled
                    ? "Cancel this schedule and revert to draft?"
                    : "Stop sending? Recipients who already received it cannot be recalled."
                }
                confirmLabel={isScheduled ? "Cancel schedule" : "Stop sending"}
                title={isScheduled ? "Cancel schedule" : "Stop sending"}
              >
                <XIcon className="h-3.5 w-3.5 text-warn" />
              </ConfirmSubmit>
            </ActionForm>
          )}

          {!isSending && (
            <ActionForm action={broadcastAction}>
              <input type="hidden" name="id" value={b.id} />
              <input type="hidden" name="op" value="delete" />
              <ConfirmSubmit
                size="sm"
                variant="danger-ghost"
                prompt="Delete this newsletter?"
                confirmLabel="Delete"
                title="Delete"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </ConfirmSubmit>
            </ActionForm>
          )}
        </>
      )}
    </div>
  );
}
