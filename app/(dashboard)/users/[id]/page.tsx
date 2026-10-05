import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteUser, resetUserTwoFactor, setUserSuspended } from "@/app/actions/admin";
import { ActionForm, ConfirmSubmit } from "@/components/action-form";
import { ChevronIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Card, CardHeader, Stat } from "@/components/ui";
import { ApiError, adminFetch, canEdit, currentAdmin } from "@/lib/api";
import { GOAL_LABEL, fmtDate, fmtDateTime, fmtDuration } from "@/lib/format";
import type { UserDetail } from "@/lib/types";
import { RoundsTable } from "../../practice/rounds-table";
import { Avatar } from "../avatar";
import { EmailUserButton } from "./email-user-button";

export const metadata: Metadata = { title: "User" };

export default async function UserPage({ params }: PageProps<"/users/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [detail, admin] = await Promise.all([
    adminFetch<UserDetail>(`/users/${id}`).catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    }),
    currentAdmin(),
  ]);
  const { user, stats, rounds, waitlist } = detail;
  const editable = canEdit(admin);

  const facts: [string, string][] = [
    ["Stage", user.stage ?? "—"],
    ["Course", user.course ?? "—"],
    ["Year", [user.year, user.semester].filter(Boolean).join(", ") || "—"],
    ["Goal", user.goal ? GOAL_LABEL[user.goal] : "—"],
    ["Default response", user.defaultResponseSeconds >= 240 ? "4:00 Case" : "1:30 Quick"],
    ["Sound cues", user.soundCues ? "On" : "Off"],
    ["Two-factor", user.twoFactorEnabled ? "On" : "Off"],
    ["Waitlist ticket", waitlist ? `#${waitlist.ticketNumber} · ${fmtDate(waitlist.joinedAt)}` : "Not on the waitlist"],
    ["Account created", fmtDateTime(user.createdAt)],
  ];

  return (
    <>
      <Link href="/users" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
        <ChevronIcon className="h-3 w-3 rotate-180" /> Users
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={56} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name ?? "No name yet"}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
              {user.email}
              {user.suspendedAt ? (
                <Badge tone="danger">Suspended {fmtDate(user.suspendedAt)}</Badge>
              ) : user.onboarded ? (
                <Badge tone="green">Onboarded</Badge>
              ) : (
                <Badge>Onboarding</Badge>
              )}
            </div>
          </div>
        </div>
        {editable && (
          <div className="flex flex-wrap items-center gap-2">
            <EmailUserButton email={user.email} name={user.name} />
            <ActionForm action={setUserSuspended}>
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="suspended" value={String(!user.suspendedAt)} />
              <SubmitButton variant="secondary" pendingLabel="Saving…">
                {user.suspendedAt ? "Restore access" : "Suspend"}
              </SubmitButton>
            </ActionForm>
            {user.twoFactorEnabled && (
              <ActionForm action={resetUserTwoFactor}>
                <input type="hidden" name="id" value={user.id} />
                <ConfirmSubmit size="md" variant="secondary" prompt="Lost their phone? This turns off their 2FA." confirmLabel="Reset 2FA">
                  Reset 2FA
                </ConfirmSubmit>
              </ActionForm>
            )}
            <ActionForm action={deleteUser}>
              <input type="hidden" name="id" value={user.id} />
              <ConfirmSubmit size="md" prompt="Delete account, rounds and recordings?" confirmLabel="Delete forever">
                Delete user
              </ConfirmSubmit>
            </ActionForm>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="dark" label="Saved rounds" value={stats.totalRounds} sub={`${stats.roundsThisWeek} this week`} />
        <Stat label="Time spoken" value={fmtDuration(stats.speakingSeconds)} />
        <Stat label="Streak" value={`${stats.currentStreakDays}d`} sub="consecutive days" />
        <Stat
          label="Most practised"
          value={<span className="text-lg">{stats.mostPractised?.category ?? "—"}</span>}
          sub={stats.mostPractised ? `${stats.mostPractised.rounds} rounds` : undefined}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[320px_1fr]">
        <Card className="self-start">
          <CardHeader title="Profile" />
          <dl className="p-5 pt-3">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line-soft py-2.5 text-[13px] last:border-0">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-medium first-letter:uppercase">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <CardHeader
            title="Recent rounds"
            description={`Latest ${rounds.items.length} of ${rounds.total}, every status`}
            actions={
              rounds.total > rounds.items.length ? (
                <Link href={`/practice?userId=${user.id}`} className="text-xs font-bold text-moss hover:underline">
                  See all
                </Link>
              ) : undefined
            }
          />
          <RoundsTable rounds={rounds.items} editable={editable} showUser={false} />
        </Card>
      </div>
    </>
  );
}
