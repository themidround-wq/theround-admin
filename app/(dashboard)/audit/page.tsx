import type { Metadata } from "next";
import { Card, Empty, PageHeader, Pagination, Segmented, Table, num, str, td, th, withParams } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { AuditEntry, Paged } from "@/lib/types";

export const metadata: Metadata = { title: "Audit log" };

const AREAS = [
  { value: "", label: "Everything" },
  { value: "auth", label: "Sign-ins" },
  { value: "waitlist", label: "Waitlist" },
  { value: "user", label: "Users" },
  { value: "round", label: "Rounds" },
  { value: "catalog", label: "Content" },
  { value: "broadcast", label: "Newsletters" },
  { value: "settings", label: "Settings" },
  { value: "team", label: "Team" },
];

const VERB: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "auth.password_change": "Changed their password",
  "auth.session_revoke": "Signed out a session",
  "auth.sessions_revoke_others": "Signed out other sessions",
  "auth.2fa_enable": "Turned on two-factor",
  "auth.2fa_disable": "Turned off two-factor",
  "auth.2fa_recovery_regenerate": "Made new recovery codes",
  "auth.recovery_code_used": "Signed in with a recovery code",
  "auth.password_reset_request": "Asked for a password reset link",
  "auth.password_reset": "Reset their password from an email link",
  "waitlist.add": "Added emails to the waitlist",
  "waitlist.invite": "Sent launch invites",
  "waitlist.delete": "Removed from the waitlist",
  "user.suspend": "Suspended a user",
  "user.unsuspend": "Restored a user",
  "user.delete": "Deleted a user",
  "user.2fa_reset": "Reset a user's two-factor",
  "round.listen": "Played a recording",
  "round.delete": "Deleted a round",
  "catalog.category_create": "Added a category",
  "catalog.category_update": "Edited a category",
  "catalog.category_reorder": "Reordered the wheel",
  "catalog.category_delete": "Deleted a category",
  "catalog.topic_create": "Added a topic",
  "catalog.topic_update": "Renamed a topic",
  "catalog.topic_delete": "Deleted a topic",
  "catalog.question_create": "Added a question",
  "catalog.question_update": "Edited a question",
  "catalog.question_delete": "Deleted a question",
  "settings.update": "Changed settings",
  "team.create": "Added a team member",
  "team.update": "Changed a team member",
  "team.delete": "Removed a team member",
  "broadcast.create": "Started a newsletter",
  "broadcast.test": "Sent a test email",
  "broadcast.schedule": "Scheduled a newsletter",
  "broadcast.send": "Sent a newsletter",
  "broadcast.cancel": "Cancelled or stopped a newsletter",
  "broadcast.retry": "Retried failed newsletter emails",
  "broadcast.delete": "Deleted a newsletter",
  "unsubscribe.add": "Unsubscribed someone",
  "unsubscribe.remove": "Resubscribed someone",
};

/** Compact one-line summary of the details JSON. */
function summary(d: Record<string, unknown> | null) {
  if (!d) return "";
  return Object.entries(d)
    .filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && v.length > 5))
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  const sp = await searchParams;
  const page = num(sp.page, 1);
  const limit = 50;
  const action = str(sp.action) ?? "";
  const data = await adminFetch<Paged<AuditEntry>>("/audit", { query: { page, limit, action } });

  return (
    <>
      <PageHeader eyebrow="Admin" title="Audit log" description="Every change made from this dashboard, and every recording played. Entries can't be edited or deleted." />
      <Card>
        <div className="overflow-x-auto border-b border-line-soft p-4">
          <Segmented options={AREAS} value={action} hrefFor={(v) => withParams("/audit", sp, { action: v, page: undefined })} />
        </div>
        {data.items.length === 0 ? (
          <Empty title="Nothing logged yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>When</th>
                <th className={th}>Who</th>
                <th className={th}>What</th>
                <th className={th}>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((e) => (
                <tr key={e.id}>
                  <td className={`${td} whitespace-nowrap text-muted`}>{fmtDateTime(e.createdAt)}</td>
                  <td className={`${td} whitespace-nowrap`}>{e.adminEmail}</td>
                  <td className={td}>
                    <span className="font-bold">{VERB[e.action] ?? e.action}</span>
                    {e.target && <div className="max-w-[320px] truncate text-xs text-muted">{e.target}</div>}
                  </td>
                  <td className={`${td} max-w-[380px] truncate text-xs text-muted`} title={summary(e.details)}>
                    {summary(e.details) || (e.ip ? `from ${e.ip}` : "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination base="/audit" params={sp} page={page} limit={limit} total={data.total} />
      </Card>
    </>
  );
}
