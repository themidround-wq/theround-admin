"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  broadcastAction,
  previewBroadcast,
  saveBroadcast,
  scheduleBroadcast,
  sendBroadcastNow,
  sendTest,
} from "@/app/actions/newsletters";
import { ActionForm, ConfirmSubmit, useToast } from "@/components/action-form";
import { Dialog } from "@/components/dialog";
import { ClockIcon, InfoIcon, MailIcon } from "@/components/icons";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Button, Card, cx, inputClass } from "@/components/ui";
import { KIND_INFO } from "@/lib/broadcast-templates";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import type { AudienceOption, Broadcast, BroadcastContent, BroadcastKind } from "@/lib/types";
import { NewsletterGuideModal } from "../guide-dialog";
import { StatusBadge } from "../status-badge";

type SaveState = "saved" | "unsaved" | "saving" | "error";

const label = "block text-xs font-bold text-muted";

export function BroadcastEditor({
  broadcast,
  audiences,
  adminEmail,
  editable,
}: {
  broadcast: Broadcast;
  /** Per kind: maintenance counts include unsubscribed users. */
  audiences: { standard: AudienceOption[]; maintenance: AudienceOption[] };
  adminEmail: string;
  editable: boolean;
}) {
  const [c, setC] = useState<BroadcastContent>({
    kind: broadcast.kind,
    subject: broadcast.subject,
    preheader: broadcast.preheader,
    headline: broadcast.headline,
    bodyHtml: broadcast.bodyHtml,
    ctaLabel: broadcast.ctaLabel,
    ctaUrl: broadcast.ctaUrl,
    audience: broadcast.audience,
    customEmails: broadcast.customEmails ?? "",
  });
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [preview, setPreview] = useState<{ html: string; subject: string } | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [dialog, setDialog] = useState<"test" | "schedule" | "send" | "guide" | null>(null);
  const toast = useToast();

  const latest = useRef(c);
  const dirty = useRef(false);

  const update = (patch: Partial<BroadcastContent>) => {
    setC((prev) => {
      const next = { ...prev, ...patch };
      latest.current = next;
      return next;
    });
    dirty.current = true;
    setSaveState("unsaved");
  };

  /** Saves now if anything changed; resolves false if the save failed. */
  const flush = useCallback(async () => {
    if (!dirty.current) return true;
    dirty.current = false;
    setSaveState("saving");
    const r = await saveBroadcast(broadcast.id, latest.current);
    if (!r.ok) {
      dirty.current = true;
      setSaveState("error");
      toast({ ok: false, message: r.message });
      return false;
    }
    setSaveState(dirty.current ? "unsaved" : "saved");
    return true;
  }, [broadcast.id, toast]);

  // Autosave 1.5s after the last change.
  useEffect(() => {
    if (!editable || !dirty.current) return;
    const t = setTimeout(() => void flush(), 1500);
    return () => clearTimeout(t);
  }, [c, editable, flush]);

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  // Live preview, rendered by the API exactly as recipients get it.
  useEffect(() => {
    const content = { ...c };
    const t = setTimeout(async () => {
      const r = await previewBroadcast({
        kind: content.kind,
        subject: content.subject,
        preheader: content.preheader,
        headline: content.headline,
        bodyHtml: content.bodyHtml,
        ctaLabel: content.ctaLabel,
        ctaUrl: content.ctaUrl,
      });
      if (r.ok) setPreview({ html: r.html, subject: r.subject });
    }, 500);
    return () => clearTimeout(t);
  }, [c]);

  const parsedEmails = (c.customEmails ?? "")
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  const customCount = parsedEmails.length;

  const list = c.kind === "maintenance" ? audiences.maintenance : audiences.standard;
  const customAudienceOption: AudienceOption = {
    key: "custom",
    label: "Specific recipients",
    description: "Send to one or more individual email addresses.",
    users: false,
    count: customCount,
    suppressed: 0,
  };
  const allowed = [...list.filter((a) => c.kind !== "maintenance" || a.users), customAudienceOption];
  const audience = c.audience === "custom" ? customAudienceOption : list.find((a) => a.key === c.audience);

  const problems = [
    !c.subject.trim() && "Add a subject.",
    !c.bodyHtml.replace(/<[^>]+>/g, "").trim() && "Write the message.",
    !!c.ctaLabel?.trim() !== !!c.ctaUrl?.trim() && "Give the button both a label and a link, or neither.",
    c.ctaUrl?.trim() && !/^https:\/\//.test(c.ctaUrl.trim()) && "The button link must start with https://.",
    c.kind === "maintenance" && c.audience !== "custom" && !audience?.users && "Service notices can only go to app users.",
    c.audience === "custom" && customCount === 0 && "Enter at least one valid recipient email address.",
    c.audience !== "custom" && audience && audience.count === 0 && "Nobody is in this audience yet.",
  ].filter(Boolean) as string[];

  const scheduled = broadcast.status === "scheduled";

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-col gap-3 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={broadcast.status} />
            <Badge tone={c.kind === "maintenance" ? "warn" : "neutral"}>{KIND_INFO[c.kind].label}</Badge>
            {editable && <SaveIndicator state={saveState} onRetry={() => void flush()} />}
          </div>
          <h1 className="mt-1 truncate text-xl font-bold tracking-tight">{c.subject || "Untitled"}</h1>
        </div>
        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setDialog("guide")}>
              <InfoIcon className="h-4 w-4" /> Guide
            </Button>
            <Button variant="secondary" onClick={() => setDialog("test")}>
              <MailIcon className="h-4 w-4" /> Send test
            </Button>
            <Button variant="secondary" disabled={problems.length > 0} onClick={() => setDialog("schedule")}>
              <ClockIcon className="h-4 w-4" /> {scheduled ? "Reschedule" : "Schedule"}
            </Button>
            <Button variant="primary" disabled={problems.length > 0} onClick={() => setDialog("send")}>
              Send now
            </Button>
          </div>
        )}
      </div>

      {scheduled && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          <span>
            Scheduled for <b>{fmtDateTime(broadcast.scheduledAt)}</b> (WAT) to {audience?.label.toLowerCase()}. Edits are saved and go out
            with it.
          </span>
          {editable && (
            <ActionForm action={broadcastAction}>
              <input type="hidden" name="id" value={broadcast.id} />
              <input type="hidden" name="op" value="cancel" />
              <SubmitButton size="sm" variant="secondary" pendingLabel="Cancelling…">
                Cancel schedule
              </SubmitButton>
            </ActionForm>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Compose */}
        <div className="space-y-3">
          <Card className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Type
                <select
                  value={c.kind}
                  disabled={!editable}
                  onChange={(e) => {
                    const kind = e.target.value as BroadcastKind;
                    const users = audiences.standard.find((a) => a.key === c.audience)?.users;
                    update({
                      kind,
                      ...(kind === "direct" && c.audience !== "custom" ? { audience: "custom" } : {}),
                      ...(kind === "maintenance" && !users && c.audience !== "custom" ? { audience: "users_all" } : {}),
                    });
                  }}
                  className={cx(inputClass, "mt-1")}
                >
                  {(Object.keys(KIND_INFO) as BroadcastKind[]).map((k) => (
                    <option key={k} value={k}>
                      {KIND_INFO[k].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Send to
                <select
                  value={c.audience}
                  disabled={!editable}
                  onChange={(e) => update({ audience: e.target.value as BroadcastContent["audience"] })}
                  className={cx(inputClass, "mt-1")}
                >
                  {allowed.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label} · {a.key === "custom" ? `${fmtNumber(customCount)} address${customCount === 1 ? "" : "es"}` : fmtNumber(a.count)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {c.audience === "custom" && (
              <div>
                <label className={label}>
                  Recipient email address{customCount > 1 ? "es" : ""}{" "}
                  <span className="font-normal">
                    ({customCount ? `${customCount} valid recipient${customCount === 1 ? "" : "s"}` : "separate with commas, spaces, or new lines"})
                  </span>
                  <textarea
                    rows={2}
                    value={c.customEmails ?? ""}
                    disabled={!editable}
                    onChange={(e) => update({ customEmails: e.target.value })}
                    placeholder="e.g. sarah@example.com, john@hospital.nhs.uk"
                    className={cx(inputClass, "mt-1 font-mono text-xs")}
                  />
                </label>
              </div>
            )}

            <p className="-mt-1 text-xs text-muted">
              {c.audience === "custom"
                ? "Direct message: will be sent specifically to the addresses entered above."
                : (
                  <>
                    {audience?.description}{" "}
                    {c.kind === "maintenance"
                      ? "Service notices also reach people who unsubscribed from newsletters."
                      : audience && audience.suppressed > 0
                        ? `${fmtNumber(audience.suppressed)} unsubscribed ${audience.suppressed === 1 ? "person is" : "people are"} left out.`
                        : ""}
                  </>
                )}
            </p>

            <label className={label}>
              Subject
              <input
                value={c.subject}
                disabled={!editable}
                maxLength={150}
                onChange={(e) => update({ subject: e.target.value })}
                placeholder="What’s new in The Round"
                className={cx(inputClass, "mt-1 text-[15px] font-bold")}
              />
            </label>
            <label className={label}>
              Preview text <span className="font-normal">(shown after the subject in the inbox)</span>
              <input
                value={c.preheader}
                disabled={!editable}
                maxLength={200}
                onChange={(e) => update({ preheader: e.target.value })}
                className={cx(inputClass, "mt-1")}
              />
            </label>
            <label className={label}>
              Headline <span className="font-normal">(big title in the email; leave empty to use the subject)</span>
              <input
                value={c.headline}
                disabled={!editable}
                maxLength={150}
                onChange={(e) => update({ headline: e.target.value })}
                className={cx(inputClass, "mt-1")}
              />
            </label>
          </Card>

          <RichTextEditor value={broadcast.bodyHtml} onChange={(bodyHtml) => update({ bodyHtml })} disabled={!editable} />

          <Card className="p-5">
            <div className="text-sm font-bold">Button</div>
            <p className="mt-0.5 text-xs text-muted">Optional call to action under the message.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]">
              <input
                value={c.ctaLabel ?? ""}
                disabled={!editable}
                maxLength={60}
                onChange={(e) => update({ ctaLabel: e.target.value || null })}
                placeholder="Open the app"
                aria-label="Button label"
                className={inputClass}
              />
              <input
                value={c.ctaUrl ?? ""}
                disabled={!editable}
                maxLength={500}
                onChange={(e) => update({ ctaUrl: e.target.value || null })}
                placeholder="https://"
                aria-label="Button link"
                className={inputClass}
              />
            </div>
          </Card>

          {editable && problems.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
              <div>
                <b className="text-ink">Before sending:</b> {problems.join(" ")}
              </div>
              <button
                type="button"
                onClick={() => setDialog("guide")}
                className="inline-flex shrink-0 items-center gap-1 font-bold text-ink underline hover:text-ink/80"
              >
                <InfoIcon className="h-3.5 w-3.5" /> What is needed?
              </button>
            </div>
          )}

          {editable && broadcast.status === "draft" && (
            <ActionForm action={broadcastAction} className="pt-2">
              <input type="hidden" name="id" value={broadcast.id} />
              <input type="hidden" name="op" value="delete" />
              <ConfirmSubmit prompt="Delete this draft?" confirmLabel="Delete draft">
                Delete draft
              </ConfirmSubmit>
            </ActionForm>
          )}
        </div>

        {/* Preview */}
        <div className="xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-2.5">
              <div className="min-w-0 text-[13px]">
                <div className="truncate font-bold">{preview?.subject || c.subject || "No subject"}</div>
                <div className="truncate text-xs text-muted">{c.preheader || "No preview text"}</div>
              </div>
              <div className="inline-flex shrink-0 rounded-lg border border-line p-0.5">
                {(["desktop", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={cx("rounded-md px-2.5 py-1 text-xs font-bold capitalize", device === d ? "bg-ink text-cream" : "text-muted")}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-center bg-line-soft/60 p-3">
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={preview?.html ?? ""}
                className="h-[70vh] rounded-lg bg-white shadow-sm transition-[width]"
                style={{ width: device === "mobile" ? 375 : "100%" }}
              />
            </div>
            <p className="border-t border-line-soft px-4 py-2 text-[11px] text-muted">
              Preview uses your name for {"{{name}}"}. Unsubscribe links work in real sends.
            </p>
          </Card>
        </div>
      </div>

      <TestDialog open={dialog === "test"} onClose={() => setDialog(null)} id={broadcast.id} adminEmail={adminEmail} flush={flush} />
      <ScheduleDialog
        open={dialog === "schedule"}
        onClose={() => setDialog(null)}
        id={broadcast.id}
        current={broadcast.scheduledAt}
        audience={audience}
        flush={flush}
      />
      <SendDialog open={dialog === "send"} onClose={() => setDialog(null)} id={broadcast.id} audience={audience} kind={c.kind} flush={flush} />
      <NewsletterGuideModal open={dialog === "guide"} onClose={() => setDialog(null)} />
    </>
  );
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "error") {
    return (
      <button onClick={onRetry} className="text-xs font-bold text-danger underline">
        Not saved. Retry
      </button>
    );
  }
  return (
    <span className="text-xs text-muted">
      {state === "saving" ? "Saving…" : state === "unsaved" ? "Unsaved changes" : "All changes saved"}
    </span>
  );
}

function TestDialog({
  open,
  onClose,
  id,
  adminEmail,
  flush,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  adminEmail: string;
  flush: () => Promise<boolean>;
}) {
  const [to, setTo] = useState(adminEmail);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Dialog open={open} onClose={onClose} title="Send a test">
      <p className="text-sm text-muted">The subject is prefixed with [Test]. Up to 5 addresses, comma separated.</p>
      <input value={to} onChange={(e) => setTo(e.target.value)} className={cx(inputClass, "mt-3")} aria-label="Test recipients" />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (!(await flush())) return;
              const list = to.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
              const r = await sendTest(id, list);
              if (r) toast(r);
              if (r?.ok) onClose();
            })
          }
        >
          {pending ? "Sending…" : "Send test"}
        </Button>
      </div>
    </Dialog>
  );
}

/** <input type="datetime-local"> value for a date, in the browser's timezone. */
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function ScheduleDialog({
  open,
  onClose,
  id,
  current,
  audience,
  flush,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  current: string | null;
  audience?: AudienceOption;
  flush: () => Promise<boolean>;
}) {
  const [at, setAt] = useState(() => {
    if (current) return toLocalInput(new Date(current));
    const d = new Date(Date.now() + 86_400_000);
    d.setHours(9, 0, 0, 0);
    return toLocalInput(d);
  });
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Dialog open={open} onClose={onClose} title="Schedule">
      <p className="text-sm text-muted">
        Goes to <b className="text-ink">{audience?.label}</b> ({fmtNumber(audience?.count ?? 0)} people, counted again when it sends). Time is in your
        browser&apos;s timezone.
      </p>
      <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={cx(inputClass, "mt-3")} aria-label="Send at" />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={pending || !at}
          onClick={() =>
            start(async () => {
              if (!(await flush())) return;
              const r = await scheduleBroadcast(id, new Date(at).toISOString());
              if (r) toast(r);
              if (r?.ok) onClose();
            })
          }
        >
          {pending ? "Scheduling…" : "Schedule"}
        </Button>
      </div>
    </Dialog>
  );
}

function SendDialog({
  open,
  onClose,
  id,
  audience,
  kind,
  flush,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  audience?: AudienceOption;
  kind: BroadcastKind;
  flush: () => Promise<boolean>;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Dialog open={open} onClose={onClose} title="Send now?">
      <p className="text-sm">
        This emails <b>{fmtNumber(audience?.count ?? 0)}</b> {audience?.label.toLowerCase()} right away. It can be stopped while sending, but
        emails already sent can&apos;t be recalled.
      </p>
      {kind === "maintenance" && <p className="mt-2 text-xs text-muted">As a service notice it also reaches people who unsubscribed from newsletters.</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              if (!(await flush())) return;
              const r = await sendBroadcastNow(id);
              if (r) toast(r);
              if (r?.ok) {
                onClose();
                window.scrollTo({ top: 0 });
              }
            })
          }
        >
          {pending ? "Starting…" : `Send to ${fmtNumber(audience?.count ?? 0)}`}
        </Button>
      </div>
    </Dialog>
  );
}
