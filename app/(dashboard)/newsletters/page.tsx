import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardHeader, Empty, PageHeader, Pagination, Segmented, Stat, Table, buttonClass, num, str, td, th, withParams } from "@/components/ui";
import { adminFetch, canEdit, currentAdmin } from "@/lib/api";
import { KIND_INFO } from "@/lib/broadcast-templates";
import { fmtAgo, fmtDateTime, fmtNumber } from "@/lib/format";
import type { AudienceOption, Broadcast, BroadcastSummary, Paged } from "@/lib/types";
import { BroadcastRowActions } from "./broadcast-row-actions";
import { NewsletterGuideButton } from "./guide-dialog";
import { NewBroadcast } from "./new-broadcast";
import { StatusBadge } from "./status-badge";

export const metadata: Metadata = { title: "Newsletters" };

const STATUSES = [
  { value: "", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
];

export default async function NewslettersPage({ searchParams }: PageProps<"/newsletters">) {
  const sp = await searchParams;
  const page = num(sp.page, 1);
  const limit = 25;
  const status = str(sp.status) ?? "";
  const [list, summary, audiences, admin] = await Promise.all([
    adminFetch<Paged<Broadcast>>("/broadcasts", { query: { page, limit, status } }),
    adminFetch<BroadcastSummary>("/broadcasts/summary"),
    adminFetch<AudienceOption[]>("/broadcasts/audiences"),
    currentAdmin(),
  ]);
  const audienceLabel = new Map(audiences.map((a) => [a.key, a.label]));
  const editable = canEdit(admin);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Newsletters"
        description="Write and send newsletters, feature updates, announcements, service notices, and direct messages to app users and waitlist."
        actions={
          <div className="flex items-center gap-2">
            <NewsletterGuideButton />
            <Link href="/newsletters/unsubscribes" className={buttonClass("secondary")}>
              Unsubscribes · {fmtNumber(summary.unsubscribed)}
            </Link>
          </div>
        }
      />
      {sp.deleted && <p className="mb-3 rounded-xl border border-line bg-card px-4 py-3 text-sm">Draft deleted.</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="dark" label="Emails sent" value={fmtNumber(summary.emailsSent30d)} sub={`${summary.broadcastsSent30d} broadcasts, last 30 days`} />
        <Stat label="Scheduled" value={summary.scheduled} sub="waiting to go out" />
        <Stat label="Drafts" value={summary.drafts} />
        <Stat label="Reachable users" value={fmtNumber(audiences.find((a) => a.key === "users_all")?.count ?? 0)} sub={`+ ${fmtNumber(audiences.find((a) => a.key === "waitlist_pending")?.count ?? 0)} on the waitlist`} />
      </div>

      {editable && (
        <Card className="mt-3">
          <CardHeader title="Start something new" description="Each starts from a template you can rewrite completely." />
          <NewBroadcast />
        </Card>
      )}

      <Card className="mt-3">
        <div className="border-b border-line-soft p-4">
          <Segmented options={STATUSES} value={status} hrefFor={(v) => withParams("/newsletters", sp, { status: v, page: undefined })} />
        </div>
        {list.items.length === 0 ? (
          <Empty title={status ? "Nothing here" : "No newsletters yet"}>{editable ? "Pick a template above to write your first one." : undefined}</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Subject</th>
                <th className={th}>Type</th>
                <th className={th}>Audience</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Delivered</th>
                <th className={th}>When</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((b) => (
                <tr key={b.id} className="hover:bg-canvas/60">
                  <td className={td}>
                    <Link href={`/newsletters/${b.id}`} className="font-bold hover:underline">
                      {b.subject || <span className="text-muted">Untitled</span>}
                    </Link>
                    <div className="text-xs text-muted">by {b.updatedBy}</div>
                  </td>
                  <td className={td}>
                    <Badge tone={b.kind === "maintenance" ? "warn" : "neutral"}>{KIND_INFO[b.kind].label}</Badge>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {b.audience === "custom" ? "Specific recipients" : (audienceLabel.get(b.audience) ?? b.audience)}
                  </td>
                  <td className={td}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td className={`${td} num whitespace-nowrap text-right`}>
                    {b.status === "draft" || b.status === "scheduled" ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <>
                        <b>{fmtNumber(b.sentCount)}</b> / {fmtNumber(b.recipientCount)}
                        {b.failedCount > 0 && <div className="text-xs text-danger">{b.failedCount} failed</div>}
                      </>
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap text-muted`}>
                    {b.status === "scheduled" ? `for ${fmtDateTime(b.scheduledAt)}` : b.sentAt ? fmtDateTime(b.sentAt) : `edited ${fmtAgo(b.updatedAt)}`}
                  </td>
                  <td className={`${td} text-right`}>
                    <BroadcastRowActions broadcast={b} editable={editable} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination base="/newsletters" params={sp} page={page} limit={limit} total={list.total} />
      </Card>
    </>
  );
}
