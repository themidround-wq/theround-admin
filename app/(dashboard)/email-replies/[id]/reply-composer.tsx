"use client";

import { useRef, useState } from "react";
import { sendReplyMessage } from "@/app/actions/email-replies";
import { ActionForm } from "@/components/action-form";
import { ReplyIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import type { Admin } from "@/lib/types";

export function ReplyComposer({
  replyId,
  recipientEmail,
  admin,
}: {
  replyId: string;
  recipientEmail: string;
  admin: Admin;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [text, setText] = useState("");

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-center justify-between pb-3 border-b border-line-soft">
        <div className="flex items-center gap-2 text-sm font-bold">
          <ReplyIcon className="h-4 w-4 text-moss" />
          <span>Reply to {recipientEmail}</span>
        </div>
        <span className="text-xs text-muted">
          Sending as <strong className="text-ink">{admin.name || admin.email}</strong>
        </span>
      </div>

      <ActionForm
        ref={formRef}
        action={async (prev, fd) => {
          const res = await sendReplyMessage(prev, fd);
          if (res?.ok) {
            setText("");
            formRef.current?.reset();
          }
          return res;
        }}
        className="mt-4 space-y-3"
      >
        <input type="hidden" name="id" value={replyId} />

        <div>
          <textarea
            name="bodyText"
            required
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Type your reply to ${recipientEmail}…`}
            className="w-full rounded-xl border border-line bg-canvas/60 p-3.5 text-sm outline-none placeholder:text-muted/70 focus:border-moss focus:bg-card focus:ring-2 focus:ring-moss/15"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted">
            Includes In-Reply-To headers so email clients thread this response.
          </p>
          <SubmitButton variant="primary" pendingLabel="Sending reply…">
            Send email reply
          </SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}
