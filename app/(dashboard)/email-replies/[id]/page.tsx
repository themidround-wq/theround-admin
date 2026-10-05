import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteReplyAction } from "@/app/actions/email-replies";
import { ActionForm, ConfirmSubmit } from "@/components/action-form";
import { ChevronIcon, MailIcon } from "@/components/icons";
import {
  Badge,
  Card,
  CardHeader,
} from "@/components/ui";
import { ApiError, adminFetch, canEdit, currentAdmin } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { EmailReply } from "@/lib/types";
import { StatusActions } from "../status-actions";
import { ReplyComposer } from "./reply-composer";

export const metadata: Metadata = { title: "Email Reply" };

export default async function EmailReplyDetailPage({
  params,
}: PageProps<"/email-replies/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [reply, admin] = await Promise.all([
    adminFetch<EmailReply>(`/email-replies/${id}`).catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    }),
    currentAdmin(),
  ]);

  const editable = canEdit(admin);
  const initial = (reply.fromName || reply.fromEmail).slice(0, 1).toUpperCase();

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/email-replies"
          className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink"
        >
          <ChevronIcon className="h-3 w-3 rotate-180" /> Email replies
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {reply.status === "unread" ? (
              <Badge tone="green">Unread</Badge>
            ) : reply.status === "read" ? (
              <Badge tone="neutral">
                {reply.replyCount > 0 ? "Replied" : "Read"}
              </Badge>
            ) : (
              <Badge tone="warn">Archived</Badge>
            )}
            <span className="text-xs text-muted">
              Received {fmtDateTime(reply.createdAt)}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {reply.subject || "(No subject)"}
          </h1>
        </div>

        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            <StatusActions
              id={reply.id}
              currentStatus={reply.status}
              size="md"
            />
            <ActionForm action={deleteReplyAction}>
              <input type="hidden" name="id" value={reply.id} />
              <ConfirmSubmit
                size="md"
                variant="danger-ghost"
                prompt="Permanently delete this email reply?"
                confirmLabel="Delete reply"
              >
                Delete
              </ConfirmSubmit>
            </ActionForm>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Left column: Original email & conversation thread */}
        <div className="space-y-4">
          {/* Inbound message card */}
          <Card>
            <div className="border-b border-line-soft p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-night text-sm font-bold text-cream">
                    {initial}
                  </div>
                  <div>
                    <div className="font-bold text-ink">
                      {reply.fromName ? (
                        <>
                          {reply.fromName}{" "}
                          <span className="font-normal text-xs text-muted">
                            &lt;{reply.fromEmail}&gt;
                          </span>
                        </>
                      ) : (
                        reply.fromEmail
                      )}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      To: {reply.toEmail} · {fmtDateTime(reply.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {reply.bodyHtml ? (
                <div
                  className="prose prose-sm max-w-none text-ink leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: reply.bodyHtml }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink font-normal font-sans">
                  {reply.bodyText || "(No message body)"}
                </div>
              )}
            </div>

            {/* Email headers collapsible details */}
            <details className="border-t border-line-soft bg-canvas/40 px-5 py-3 text-xs">
              <summary className="cursor-pointer font-bold text-muted hover:text-ink">
                View Email Headers & IDs
              </summary>
              <div className="mt-3 space-y-1.5 font-mono text-[11px] text-muted overflow-x-auto">
                <div>
                  <strong>From:</strong> {reply.fromEmail}
                </div>
                <div>
                  <strong>To:</strong> {reply.toEmail}
                </div>
                {reply.messageId && (
                  <div>
                    <strong>Message-ID:</strong> {reply.messageId}
                  </div>
                )}
                {reply.inReplyTo && (
                  <div>
                    <strong>In-Reply-To:</strong> {reply.inReplyTo}
                  </div>
                )}
                {reply.resendEmailId && (
                  <div>
                    <strong>Resend Email ID:</strong> {reply.resendEmailId}
                  </div>
                )}
              </div>
            </details>
          </Card>

          {/* Conversation history (Admin replies & follow-ups) */}
          {reply.messages && reply.messages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted px-1">
                Conversation Thread ({reply.messages.length})
              </h3>
              {reply.messages.map((m) => {
                const isAdmin = m.senderType === "admin";
                return (
                  <Card
                    key={m.id}
                    className={
                      isAdmin
                        ? "border-moss/30 bg-moss/[0.02]"
                        : "border-line bg-card"
                    }
                  >
                    <div className="border-b border-line-soft p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? "bg-night text-cream"
                              : "bg-line-soft text-slate"
                          }`}
                        >
                          {isAdmin ? "Admin Response" : "Follow-up"}
                        </span>
                        <span className="text-xs font-bold">
                          {m.senderName || m.senderEmail}
                        </span>
                        <span className="text-xs text-muted">
                          &lt;{m.senderEmail}&gt;
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {fmtDateTime(m.createdAt)}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                        {m.bodyText}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Reply composer */}
          {editable && (
            <ReplyComposer
              replyId={reply.id}
              recipientEmail={reply.fromEmail}
              admin={admin}
            />
          )}
        </div>

        {/* Right column: Context cards */}
        <div className="space-y-4">
          {/* User profile context */}
          <Card>
            <CardHeader title="Sender profile" />
            <div className="p-5 pt-3">
              {reply.user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-bold text-ink">
                      {(reply.user.name || reply.user.email).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/users/${reply.user.id}`}
                        className="font-bold hover:underline block truncate text-sm"
                      >
                        {reply.user.name || "App User"}
                      </Link>
                      <div className="text-xs text-muted truncate">
                        {reply.user.email}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/users/${reply.user.id}`}
                    className="block text-center rounded-lg border border-line py-1.5 text-xs font-bold text-ink hover:bg-line-soft transition-colors"
                  >
                    View user profile →
                  </Link>
                </div>
              ) : (
                <div className="text-xs text-muted space-y-2">
                  <p>
                    <strong>{reply.fromEmail}</strong> does not have an active app account.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Broadcast newsletter context */}
          {reply.broadcast && (
            <Card>
              <CardHeader title="Newsletter context" />
              <div className="p-5 pt-3 space-y-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted">
                    Replied to broadcast
                  </div>
                  <Link
                    href={`/newsletters/${reply.broadcast.id}`}
                    className="mt-1 block font-bold text-sm hover:underline text-ink"
                  >
                    {reply.broadcast.subject}
                  </Link>
                </div>
                <Link
                  href={`/newsletters/${reply.broadcast.id}`}
                  className="block text-center rounded-lg border border-line py-1.5 text-xs font-bold text-ink hover:bg-line-soft transition-colors"
                >
                  View broadcast report →
                </Link>
              </div>
            </Card>
          )}

          {/* Metadata details */}
          <Card>
            <CardHeader title="Conversation details" />
            <dl className="p-5 pt-3 text-xs space-y-2.5">
              <div className="flex justify-between gap-2 border-b border-line-soft pb-2">
                <dt className="text-muted">Status</dt>
                <dd className="font-bold first-letter:uppercase">{reply.status}</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-line-soft pb-2">
                <dt className="text-muted">Responses</dt>
                <dd className="font-medium">{reply.replyCount} sent</dd>
              </div>
              <div className="flex justify-between gap-2 border-b border-line-soft pb-2">
                <dt className="text-muted">Received at</dt>
                <dd className="font-medium text-right">{fmtDateTime(reply.createdAt)}</dd>
              </div>
              {reply.lastRepliedAt && (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Last reply</dt>
                  <dd className="font-medium text-right">{fmtDateTime(reply.lastRepliedAt)}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
