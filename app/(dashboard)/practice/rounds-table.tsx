"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteRound, roundAudioUrl } from "@/app/actions/admin";
import { ActionForm, ConfirmSubmit, useToast } from "@/components/action-form";
import { PlayIcon, TrashIcon } from "@/components/icons";
import { Badge, Button, Empty, Table, td, th } from "@/components/ui";
import { REFLECTION_LABEL, STATUS_LABEL, fmtAgo, fmtDateTime, fmtDuration } from "@/lib/format";
import type { Round } from "@/lib/types";

const STATUS_TONE = { saved: "green", completed: "warn", in_progress: "neutral", spun: "neutral" } as const;

export function RoundsTable({ rounds, editable, showUser = true }: { rounds: Round[]; editable: boolean; showUser?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!rounds.length) return <Empty title="No rounds yet">Rounds show up here once someone spins the wheel.</Empty>;

  return (
    <Table>
      <thead>
        <tr>
          {showUser && <th className={th}>User</th>}
          <th className={th}>Question</th>
          <th className={th}>Status</th>
          <th className={`${th} text-right`}>Spoke</th>
          <th className={th}>When</th>
          <th className={th} />
        </tr>
      </thead>
      <tbody>
        {rounds.map((r) => (
          <FragmentRow key={r.id} r={r} showUser={showUser} editable={editable} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
        ))}
      </tbody>
    </Table>
  );
}

function FragmentRow({
  r,
  showUser,
  editable,
  open,
  onToggle,
}: {
  r: Round;
  showUser: boolean;
  editable: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const cols = showUser ? 6 : 5;
  return (
    <>
      <tr className={open ? "bg-canvas" : "cursor-pointer hover:bg-canvas/60"} onClick={onToggle}>
        {showUser && (
          <td className={td}>
            <Link href={`/users/${r.user.id}`} onClick={(e) => e.stopPropagation()} className="font-bold hover:underline">
              {r.user.name ?? r.user.email.split("@")[0]}
            </Link>
          </td>
        )}
        <td className={`${td} max-w-[420px]`}>
          <div className="truncate">{r.question.text}</div>
          <div className="text-xs text-muted">
            {r.category.name} · {r.topic.name}
          </div>
        </td>
        <td className={td}>
          <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
        </td>
        <td className={`${td} num whitespace-nowrap text-right`}>
          {r.spokenSeconds ? fmtDuration(r.spokenSeconds) : "—"}
          <div className="text-xs text-muted">of {r.responseType === "case" ? "4:00" : "1:30"}</div>
        </td>
        <td className={`${td} whitespace-nowrap text-muted`} title={fmtDateTime(r.createdAt)}>
          {fmtAgo(r.savedAt ?? r.createdAt)}
        </td>
        <td className={`${td} text-right text-xs font-bold text-moss`}>{open ? "Close" : "Open"}</td>
      </tr>
      {open && (
        <tr className="bg-canvas">
          <td colSpan={cols} className="px-4 pb-4">
            <div className="grid gap-4 rounded-xl border border-line bg-card p-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-3 text-[13px]">
                <p className="font-serif-italic text-base leading-snug">“{r.question.text}”</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted">
                  <span>Reflection: <b className="text-ink">{r.reflection ? REFLECTION_LABEL[r.reflection] : "—"}</b></span>
                  <span>Spun {fmtDateTime(r.createdAt)}</span>
                  {r.savedAt && <span>Saved {fmtDateTime(r.savedAt)}</span>}
                  {r.bookmarked && <span>Bookmarked</span>}
                </div>
                {r.note && <p className="rounded-lg bg-canvas p-3">{r.note}</p>}
                {editable && r.hasAudio && <AudioPlayer id={r.id} />}
                {!r.hasAudio && <p className="text-xs text-muted">No recording.</p>}
              </div>
              {editable && (
                <ActionForm action={deleteRound} className="self-start">
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmSubmit prompt="Delete round and recording?" confirmLabel="Delete">
                    <TrashIcon className="h-3.5 w-3.5" /> Delete
                  </ConfirmSubmit>
                </ActionForm>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Fetches a short-lived signed URL only when asked; every listen is audit-logged. */
function AudioPlayer({ id }: { id: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();

  if (url) return <audio controls autoPlay src={url} className="h-10 w-full max-w-md" />;
  return (
    <Button
      size="sm"
      variant="primary"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await roundAudioUrl(id);
          if (r.url) setUrl(r.url);
          else toast({ ok: false, message: r.error ?? "Couldn't load the recording." });
        })
      }
    >
      <PlayIcon className="h-3.5 w-3.5" /> {pending ? "Loading…" : "Play recording"}
    </Button>
  );
}
