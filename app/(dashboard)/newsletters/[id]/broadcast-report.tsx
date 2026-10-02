import { broadcastAction } from "@/app/actions/newsletters";
import { ActionForm, ConfirmSubmit } from "@/components/action-form";
import { SearchForm } from "@/components/search-form";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Card, CardHeader, Empty, Pagination, Segmented, Stat, Table, td, th, withParams } from "@/components/ui";
import { KIND_INFO } from "@/lib/broadcast-templates";
import { fmtDateTime, fmtNumber, pct } from "@/lib/format";
import type { Broadcast, BroadcastRecipient, Paged } from "@/lib/types";
import { StatusBadge } from "../status-badge";
import { AutoRefresh } from "./auto-refresh";

const RECIPIENT_TONE = { sent: "green", failed: "danger", pending: "neutral", sending: "lime" } as const;
const RECIPIENT_LABEL = { sent: "Sent", failed: "Failed", pending: "Queued", sending: "Sending" };

export function BroadcastReport({
  broadcast: b,
  recipients,
  previewHtml,
  audienceLabel,
  editable,
  params,
}: {
  broadcast: Broadcast;
  recipients: Paged<BroadcastRecipient>;
  previewHtml: string;
  audienceLabel: string;
  editable: boolean;
  params: Record<string, string | string[] | undefined>;
}) {
  const base = `/newsletters/${b.id}`;
  const done = b.sentCount + b.failedCount;
  const sending = b.status === "sending";
  const status = typeof params.status === "string" ? params.status : "";

  return (
    <>
      {sending && <AutoRefresh seconds={3} />}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={b.status} />
            <Badge tone={b.kind === "maintenance" ? "warn" : "neutral"}>{KIND_INFO[b.kind].label}</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{b.subject}</h1>
          <p className="mt-1 text-sm text-muted">
            To {audienceLabel.toLowerCase()} · started {fmtDateTime(b.startedAt)}
            {b.sentAt && ` · finished ${fmtDateTime(b.sentAt)}`} · by {b.updatedBy}
          </p>
        </div>
        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            {sending && (
              <OpForm id={b.id} op="cancel">
                <ConfirmSubmit size="md" variant="danger-ghost" prompt="Stop sending?" confirmLabel="Stop">
                  Stop sending
                </ConfirmSubmit>
              </OpForm>
            )}
            {!sending && b.failedCount > 0 && (
              <OpForm id={b.id} op="retry">
                <SubmitButton variant="secondary" pendingLabel="Retrying…">
                  Retry {b.failedCount} failed
                </SubmitButton>
              </OpForm>
            )}
            <OpForm id={b.id} op="duplicate">
              <SubmitButton variant="primary" pendingLabel="Copying…">
                Duplicate as draft
              </SubmitButton>
            </OpForm>
            {b.status === "cancelled" && (
              <OpForm id={b.id} op="delete">
                <ConfirmSubmit size="md" prompt="Delete this record?" confirmLabel="Delete">
                  Delete
                </ConfirmSubmit>
              </OpForm>
            )}
          </div>
        )}
      </div>

      {sending && (
        <Card className="mb-3 p-5">
          <div className="mb-2 flex justify-between text-sm">
            <b>Sending…</b>
            <span className="num text-muted">
              {fmtNumber(done)} of {fmtNumber(b.recipientCount)} · {pct(done, b.recipientCount)}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-line-soft">
            <div className="h-full rounded-full bg-moss transition-[width] duration-700" style={{ width: `${pct(done, b.recipientCount)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">Batches of 100. You can leave this page; it keeps going on the server.</p>
        </Card>
      )}
      {b.status === "cancelled" && (
        <p className="mb-3 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          Stopped before everyone got it. {fmtNumber(b.recipientCount - done)} people were never sent this.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="dark" label="Delivered to Resend" value={fmtNumber(b.sentCount)} sub={`${pct(b.sentCount, b.recipientCount)}% of recipients`} />
        <Stat label="Recipients" value={fmtNumber(b.recipientCount)} sub="audience when sending started" />
        <Stat label="Failed" value={fmtNumber(b.failedCount)} sub={b.failedCount ? "see the list below" : "none"} />
        <Stat label="Left out" value={fmtNumber(b.suppressedCount)} sub="unsubscribed" />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Recipients" />
          <div className="flex flex-col gap-3 border-b border-line-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <Segmented
              options={[
                { value: "", label: "All" },
                { value: "sent", label: "Sent" },
                { value: "failed", label: "Failed" },
                { value: "pending", label: "Queued" },
              ]}
              value={status}
              hrefFor={(v) => withParams(base, params, { status: v, page: undefined })}
            />
            <SearchForm action={base} params={params} placeholder="Search emails" />
          </div>
          {recipients.items.length === 0 ? (
            <Empty title="Nobody here" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th className={th}>Email</th>
                  <th className={th}>Status</th>
                  <th className={th}>Sent</th>
                </tr>
              </thead>
              <tbody>
                {recipients.items.map((r) => (
                  <tr key={r.id}>
                    <td className={td}>
                      {r.email}
                      {r.error && <div className="max-w-[320px] truncate text-xs text-danger" title={r.error}>{r.error}</div>}
                    </td>
                    <td className={td}>
                      <Badge tone={RECIPIENT_TONE[r.status]}>{RECIPIENT_LABEL[r.status]}</Badge>
                    </td>
                    <td className={`${td} whitespace-nowrap text-muted`}>{fmtDateTime(r.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Pagination base={base} params={params} page={recipients.page} limit={recipients.limit} total={recipients.total} />
        </Card>

        <Card className="overflow-hidden xl:self-start">
          <CardHeader title="What they got" description="Shown with your name; each recipient saw their own." />
          <div className="mt-4 bg-line-soft/60 p-3">
            <iframe title="Sent email" sandbox="" srcDoc={previewHtml} className="h-[70vh] w-full rounded-lg bg-white" />
          </div>
        </Card>
      </div>
    </>
  );
}

function OpForm({ id, op, children }: { id: string; op: string; children: React.ReactNode }) {
  return (
    <ActionForm action={broadcastAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      {children}
    </ActionForm>
  );
}
