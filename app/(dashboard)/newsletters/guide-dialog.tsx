"use client";

import { useState } from "react";
import { Dialog } from "@/components/dialog";
import { CheckIcon, ClockIcon, InfoIcon, MailIcon, Sparkle } from "@/components/icons";
import { Badge, Button } from "@/components/ui";

export function NewsletterGuideModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="How to write & send newsletters"
      className="w-[min(620px,calc(100vw-2rem))]"
      bodyClassName="space-y-6 max-h-[80vh] overflow-y-auto"
    >
      {/* Overview Intro */}
      <div className="rounded-xl border border-line-soft bg-canvas/60 p-4 text-sm leading-relaxed text-muted">
        <p>
          Broadcasts let you send beautiful, mobile-optimized emails to app users and waitlist members.
          Follow the checklist below to make sure your email is ready to schedule or send.
        </p>
      </div>

      {/* Checklist */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            Checklist for Sending & Scheduling
          </h3>
          <Badge tone="green">Required</Badge>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-card p-3 text-sm">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
              <CheckIcon className="h-3 w-3" />
            </div>
            <div>
              <b className="text-ink">1. Subject line</b>
              <p className="mt-0.5 text-xs text-muted">
                Add an engaging subject line (max 150 chars). Optional preview text appears in the recipient inbox list after the subject.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-card p-3 text-sm">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
              <CheckIcon className="h-3 w-3" />
            </div>
            <div>
              <b className="text-ink">2. Message body</b>
              <p className="mt-0.5 text-xs text-muted">
                Write your message in the editor. You can use headings, bullet lists, quotes, and <code className="rounded bg-line-soft px-1 py-0.5 font-mono text-[11px] text-ink">{"{{name}}"}</code> to automatically insert the recipient's first name.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-card p-3 text-sm">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
              <CheckIcon className="h-3 w-3" />
            </div>
            <div>
              <b className="text-ink">3. Audience or Specific recipients</b>
              <p className="mt-0.5 text-xs text-muted">
                Choose a pre-defined audience segment (All users, Students, Waitlist, etc.) or choose <b className="text-ink">Specific recipients</b> to type/paste one or multiple individual email addresses (separated by commas or spaces).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-line-soft bg-card p-3 text-sm">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
              <CheckIcon className="h-3 w-3" />
            </div>
            <div>
              <b className="text-ink">4. Call to action button (Pair or leave empty)</b>
              <p className="mt-0.5 text-xs text-muted">
                If you enter a button label (e.g. &ldquo;Spin a round&rdquo;), you must also supply an <code className="font-mono text-[11px]">https://</code> link. If no button is needed, keep both fields blank.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow steps */}
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">
          Recommended Workflow
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line-soft p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-line-soft text-ink">
              <Sparkle className="h-4 w-4" />
            </div>
            <div className="mt-2.5 font-bold text-xs">1. Live preview</div>
            <p className="mt-1 text-[11px] leading-normal text-muted">
              Check how your email looks on desktop and mobile viewports in real time as you type.
            </p>
          </div>

          <div className="rounded-xl border border-line-soft p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-line-soft text-ink">
              <MailIcon className="h-4 w-4" />
            </div>
            <div className="mt-2.5 font-bold text-xs">2. Send a test</div>
            <p className="mt-1 text-[11px] leading-normal text-muted">
              Use &ldquo;Send test&rdquo; to send a copy prefixed with <code className="font-mono">[Test]</code> to your own inbox before broadcasting.
            </p>
          </div>

          <div className="rounded-xl border border-line-soft p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-line-soft text-ink">
              <ClockIcon className="h-4 w-4" />
            </div>
            <div className="mt-2.5 font-bold text-xs">3. Send or Schedule</div>
            <p className="mt-1 text-[11px] leading-normal text-muted">
              Choose &ldquo;Send now&rdquo; for immediate batched delivery, or &ldquo;Schedule&rdquo; for a future local date &amp; time.
            </p>
          </div>
        </div>
      </div>

      {/* Unsubscribes note */}
      <div className="rounded-xl border border-line bg-card p-4 text-xs text-muted">
        <b className="text-ink">Unsubscribes &amp; Safety:</b> Every broadcast automatically includes an unsubscribe link. Unsubscribed contacts are automatically left out of newsletters. If any send encounters delivery errors, you can inspect recipient logs and click <b>Retry failed</b> on the report page.
      </div>

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </Dialog>
  );
}

export function NewsletterGuideButton({
  variant = "secondary",
  className,
}: {
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        <InfoIcon className="h-4 w-4" /> How to use
      </Button>
      <NewsletterGuideModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

