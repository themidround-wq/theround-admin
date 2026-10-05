import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import {
  Badge,
  Card,
  Empty,
  PageHeader,
  Pagination,
  Segmented,
  Stat,
  Table,
  num,
  str,
  td,
  th,
  withParams,
} from "@/components/ui";
import { adminFetch, canEdit, currentAdmin } from "@/lib/api";
import { fmtAgo, fmtDateTime, fmtNumber } from "@/lib/format";
import type {
  EmailReply,
  EmailReplySummary,
  Paged,
} from "@/lib/types";
import { StatusActions } from "./status-actions";
import { TestReplyDialog } from "./test-reply-dialog";

export const metadata: Metadata = { title: "Email Replies" };

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

export default async function EmailRepliesPage({
  searchParams,
}: PageProps<"/email-replies">) {
  const sp = await searchParams;
  const page = num(sp.page, 1);
  const limit = 25;
  const status = str(sp.status) ?? "";
  const search = str(sp.q) ?? "";
  const broadcastId = str(sp.broadcastId) ?? "";
  const userId = str(sp.userId) ?? "";

  const [list, summary, admin] = await Promise.all([
    adminFetch<Paged<EmailReply>>("/email-replies", {
      query: {
        page,
        limit,
        status: status || undefined,
        search: search || undefined,
        broadcastId: broadcastId || undefined,
        userId: userId || undefined,
      },
    }),
    adminFetch<EmailReplySummary>("/email-replies/summary"),
    currentAdmin(),
  ]);

  const editable = canEdit(admin);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Email replies"
        description="View and respond to inbound emails and replies from app users, subscribers, and waitlist members."
        actions={
          editable && (
            <div className="flex items-center gap-2">
              <TestReplyDialog />
            </div>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          tone="dark"
          label="Total replies"
          value={fmtNumber(summary.total)}
          sub={`${summary.replied} replied by team`}
        />
        <Stat
          label="Unread"
          value={fmtNumber(summary.unread)}
          sub={summary.unread > 0 ? "needs attention" : "inbox zero"}
        />
        <Stat
          label="Read / Answered"
          value={fmtNumber(summary.read)}
          sub={`${summary.replied} responses sent`}
        />
        <Stat
          label="Archived"
          value={fmtNumber(summary.archived)}
          sub="closed conversations"
        />
      </div>

      <Card className="mt-4">
        <div className="flex flex-col gap-3 border-b border-line-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            options={STATUS_FILTERS}
            value={status}
            hrefFor={(v) =>
              withParams("/email-replies", sp, { status: v, page: undefined })
            }
          />
          <SearchForm
            action="/email-replies"
            params={sp}
            placeholder="Search sender, subject, or message…"
          />
        </div>

        {broadcastId && (
          <div className="flex items-center justify-between border-b border-line-soft bg-canvas/40 px-4 py-2 text-xs">
            <span className="text-muted">Filtered by newsletter broadcast</span>
            <Link
              href={withParams("/email-replies", sp, { broadcastId: undefined })}
              className="font-bold text-moss hover:underline"
            >
              Clear filter
            </Link>
          </div>
        )}

        {userId && (
          <div className="flex items-center justify-between border-b border-line-soft bg-canvas/40 px-4 py-2 text-xs">
            <span className="text-muted">Filtered by user</span>
            <Link
              href={withParams("/email-replies", sp, { userId: undefined })}
              className="font-bold text-moss hover:underline"
            >
              Clear filter
            </Link>
          </div>
        )}

        {list.items.length === 0 ? (
          <Empty
            title={status ? `No ${status} replies` : search ? "No matches found" : "No email replies yet"}
          >
            {editable && !status && !search
              ? "When users or newsletter recipients reply to your emails, their messages will appear here. Click 'Simulate reply' above to test."
              : undefined}
          </Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Sender</th>
                <th className={th}>Subject & Snippet</th>
                <th className={th}>Context</th>
                <th className={th}>Status</th>
                <th className={th}>Received</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((r) => {
                const initial = (r.fromName || r.fromEmail).slice(0, 1).toUpperCase();
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-canvas/60 ${
                      r.status === "unread" ? "bg-moss/[0.03] font-medium" : ""
                    }`}
                  >
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night/5 text-xs font-bold text-ink">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/email-replies/${r.id}`}
                            className="truncate font-bold hover:underline block max-w-[180px]"
                          >
                            {r.fromName || r.fromEmail}
                          </Link>
                          {r.fromName && (
                            <div className="truncate text-xs text-muted max-w-[180px]">
                              {r.fromEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className={td}>
                      <Link
                        href={`/email-replies/${r.id}`}
                        className="font-bold text-ink hover:underline block max-w-[340px] truncate"
                      >
                        {r.subject || "(No subject)"}
                      </Link>
                      <div className="mt-0.5 max-w-[340px] truncate text-xs text-muted">
                        {r.snippet || "No preview text"}
                      </div>
                    </td>

                    <td className={`${td} whitespace-nowrap`}>
                      <div className="flex flex-col gap-1 items-start">
                        {r.user ? (
                          <Link
                            href={`/users/${r.user.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-moss border border-line-soft hover:border-moss"
                          >
                            User profile
                          </Link>
                        ) : null}

                        {r.broadcast ? (
                          <Link
                            href={`/newsletters/${r.broadcast.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate border border-line-soft hover:border-slate"
                            title={r.broadcast.subject}
                          >
                            Newsletter
                          </Link>
                        ) : null}

                        {!r.user && !r.broadcast && (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </div>
                    </td>

                    <td className={td}>
                      {r.status === "unread" ? (
                        <Badge tone="green">Unread</Badge>
                      ) : r.status === "read" ? (
                        <Badge tone="neutral">
                          {r.replyCount > 0 ? "Replied" : "Read"}
                        </Badge>
                      ) : (
                        <Badge tone="warn">Archived</Badge>
                      )}
                    </td>

                    <td className={`${td} whitespace-nowrap text-muted text-xs`}>
                      <span title={fmtDateTime(r.createdAt)}>{fmtAgo(r.createdAt)}</span>
                      {r.lastRepliedAt && (
                        <div className="text-[11px] text-moss">
                          Replied {fmtAgo(r.lastRepliedAt)}
                        </div>
                      )}
                    </td>

                    <td className={`${td} text-right whitespace-nowrap`}>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/email-replies/${r.id}`}
                          className="text-xs font-bold text-moss hover:underline mr-1"
                        >
                          View
                        </Link>
                        {editable && (
                          <StatusActions id={r.id} currentStatus={r.status} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}

        <Pagination
          base="/email-replies"
          params={sp}
          page={page}
          limit={limit}
          total={list.total}
        />
      </Card>
    </>
  );
}
