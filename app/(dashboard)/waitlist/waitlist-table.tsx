"use client";

import Link from "next/link";
import { useState } from "react";
import { removeFromWaitlist, inviteFromWaitlist } from "@/app/actions/admin";
import { ActionForm, ConfirmSubmit } from "@/components/action-form";
import { MailIcon, TrashIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Empty, Table, td, th } from "@/components/ui";
import { fmtAgo, fmtDateTime } from "@/lib/format";
import type { WaitlistEntry } from "@/lib/types";

const TONE = { joined: "green", invited: "warn", pending: "neutral" } as const;
const LABEL = { joined: "Has account", invited: "Invited", pending: "Not invited" };

export function WaitlistTable({ items, editable }: { items: WaitlistEntry[]; editable: boolean }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  // Only people without an account can be invited.
  const invitable = items.filter((w) => w.status !== "joined");
  const allOn = invitable.length > 0 && invitable.every((w) => selected.has(w.id));

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  if (!items.length) return <Empty title="No one here">Try another filter, or clear the search.</Empty>;

  return (
    <>
      {editable && selected.size > 0 && (
        <ActionForm
          action={inviteFromWaitlist}
          onSuccess={() => setSelected(new Set())}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-lime/25 px-4 py-2.5"
        >
          <input type="hidden" name="ids" value={[...selected].join(",")} />
          <span className="text-sm font-bold">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-bold text-muted hover:text-ink">
              Clear
            </button>
            <SubmitButton variant="primary" size="sm" pendingLabel="Sending…">
              <MailIcon className="h-3.5 w-3.5" /> Send launch invite
            </SubmitButton>
          </div>
        </ActionForm>
      )}
      <Table>
        <thead>
          <tr>
            {editable && (
              <th className={`${th} w-10`}>
                <input
                  type="checkbox"
                  aria-label="Select everyone on this page who can be invited"
                  checked={allOn}
                  onChange={() => setSelected(allOn ? new Set() : new Set(invitable.map((w) => w.id)))}
                  className="h-4 w-4 accent-[#14271a]"
                />
              </th>
            )}
            <th className={th}>Ticket</th>
            <th className={th}>Email</th>
            <th className={th}>Status</th>
            <th className={th}>Joined</th>
            <th className={th}>Invited</th>
            {editable && <th className={th} />}
          </tr>
        </thead>
        <tbody>
          {items.map((w) => (
            <tr key={w.id} className={selected.has(w.id) ? "bg-lime/10" : "hover:bg-canvas/60"}>
              {editable && (
                <td className={td}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${w.email}`}
                    disabled={w.status === "joined"}
                    checked={selected.has(w.id)}
                    onChange={() => toggle(w.id)}
                    className="h-4 w-4 accent-[#14271a] disabled:opacity-30"
                  />
                </td>
              )}
              <td className={`${td} num font-bold`}>#{w.ticketNumber}</td>
              <td className={td}>
                {w.userId ? (
                  <Link href={`/users/${w.userId}`} className="hover:underline">
                    {w.email}
                  </Link>
                ) : (
                  w.email
                )}
              </td>
              <td className={td}>
                <Badge tone={TONE[w.status]}>{LABEL[w.status]}</Badge>
              </td>
              <td className={`${td} whitespace-nowrap text-muted`} title={fmtDateTime(w.createdAt)}>
                {fmtAgo(w.createdAt)}
              </td>
              <td className={`${td} whitespace-nowrap text-muted`}>{w.invitedAt ? fmtDateTime(w.invitedAt) : "—"}</td>
              {editable && (
                <td className={`${td} text-right`}>
                  <ActionForm action={removeFromWaitlist}>
                    <input type="hidden" name="id" value={w.id} />
                    <ConfirmSubmit prompt="Remove?" confirmLabel="Remove">
                      <TrashIcon className="h-3.5 w-3.5" />
                      <span className="sr-only">Remove {w.email}</span>
                    </ConfirmSubmit>
                  </ActionForm>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
