"use client";

import { useTransition } from "react";
import { updateReplyStatus } from "@/app/actions/email-replies";
import { CheckIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import type { EmailReplyStatus } from "@/lib/types";

export function StatusActions({
  id,
  currentStatus,
  size = "sm",
}: {
  id: string;
  currentStatus: EmailReplyStatus;
  size?: "sm" | "md";
}) {
  const [isPending, startTransition] = useTransition();

  const handleStatus = (status: EmailReplyStatus) => {
    startTransition(async () => {
      await updateReplyStatus(id, status);
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      {currentStatus === "unread" ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatus("read")}
          className={buttonClass("secondary", size)}
          title="Mark as read"
        >
          <CheckIcon className="h-3.5 w-3.5" /> Mark read
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatus("unread")}
          className={buttonClass("secondary", size)}
          title="Mark as unread"
        >
          Mark unread
        </button>
      )}

      {currentStatus !== "archived" ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatus("archived")}
          className={buttonClass("ghost", size)}
          title="Archive reply"
        >
          Archive
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatus("read")}
          className={buttonClass("ghost", size)}
          title="Unarchive reply"
        >
          Unarchive
        </button>
      )}
    </div>
  );
}
