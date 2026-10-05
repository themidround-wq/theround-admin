"use client";

import { useState } from "react";
import { createTestInboundReply } from "@/app/actions/email-replies";
import { ActionForm } from "@/components/action-form";
import { CloseIcon, PlusIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { buttonClass, inputClass } from "@/components/ui";

export function TestReplyDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass("secondary")}
      >
        <PlusIcon className="h-4 w-4" /> Simulate reply
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-line bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-line-soft">
              <div>
                <h3 className="text-base font-bold">Simulate Inbound Reply</h3>
                <p className="text-xs text-muted">Test how replies from users or subscribers appear in the dashboard.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-line-soft hover:text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <ActionForm
              action={async (prev, fd) => {
                const res = await createTestInboundReply(prev, fd);
                if (res?.ok) setOpen(false);
                return res;
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  Sender Email
                </label>
                <input
                  type="email"
                  name="from"
                  required
                  placeholder="doctor@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  Sender Name (optional)
                </label>
                <input
                  type="text"
                  name="fromName"
                  placeholder="Dr. Alex Morgan"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  defaultValue="Re: What's new in The Round"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                  Reply Body
                </label>
                <textarea
                  name="text"
                  required
                  rows={4}
                  placeholder="Hi team, loved the recent pharmacology round updates! Any plans for pediatric cases?"
                  className="w-full rounded-lg border border-line bg-card p-3 text-sm outline-none placeholder:text-muted/70 focus:border-moss focus:ring-2 focus:ring-moss/15"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={buttonClass("ghost")}
                >
                  Cancel
                </button>
                <SubmitButton variant="primary" pendingLabel="Creating…">
                  Create test reply
                </SubmitButton>
              </div>
            </ActionForm>
          </div>
        </div>
      )}
    </>
  );
}
