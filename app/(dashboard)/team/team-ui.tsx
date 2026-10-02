"use client";

import { useState } from "react";
import { createTeamMember, deleteTeamMember, updateTeamMember } from "@/app/actions/admin";
import { ActionForm, ConfirmSubmit } from "@/components/action-form";
import { Dialog } from "@/components/dialog";
import { PlusIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Button, Table, cx, inputClass, td, th } from "@/components/ui";
import { fmtAgo, fmtDate } from "@/lib/format";
import type { Admin, Role } from "@/lib/types";

const ROLES: { value: Role; label: string }[] = [
  { value: "viewer", label: "Viewer" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
];

/** A strong temporary password the owner can copy and share. */
function tempPassword() {
  // No look-alikes (i, l, o, I, L, O, 0, 1).
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function AddMember() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  return (
    <>
      <Button
        variant="primary"
        onClick={() => {
          setPassword(tempPassword());
          setOpen(true);
        }}
      >
        <PlusIcon className="h-4 w-4" /> Add someone
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Add a team member">
        <ActionForm action={createTeamMember} onSuccess={() => setOpen(false)} className="space-y-3">
          <label className="block text-xs font-bold text-muted">
            Name
            <input name="name" required maxLength={80} autoFocus className={cx(inputClass, "mt-1")} />
          </label>
          <label className="block text-xs font-bold text-muted">
            Email
            <input name="email" type="email" required className={cx(inputClass, "mt-1")} />
          </label>
          <label className="block text-xs font-bold text-muted">
            Role
            <select name="role" defaultValue="admin" className={cx(inputClass, "mt-1")}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-bold text-muted">
            Temporary password
            <input
              name="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cx(inputClass, "num mt-1 font-mono")}
            />
            <span className="mt-1 block font-normal">Copy it now and share it privately. They can change it in Settings.</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton variant="primary" pendingLabel="Adding…">
              Add to team
            </SubmitButton>
          </div>
        </ActionForm>
      </Dialog>
    </>
  );
}

export function TeamTable({ team, meId, owner }: { team: Admin[]; meId: string; owner: boolean }) {
  const [resetFor, setResetFor] = useState<Admin | null>(null);
  const [password, setPassword] = useState("");

  return (
    <>
      <Table>
        <thead>
          <tr>
            <th className={th}>Person</th>
            <th className={th}>Role</th>
            <th className={th}>Status</th>
            <th className={th}>2FA</th>
            <th className={th}>Last sign-in</th>
            <th className={th}>Added</th>
            {owner && <th className={th} />}
          </tr>
        </thead>
        <tbody>
          {team.map((a) => {
            const me = a.id === meId;
            return (
              <tr key={a.id} className={cx(!a.active && "text-muted")}>
                <td className={td}>
                  <div className="font-bold">
                    {a.name} {me && <span className="font-normal text-muted">(you)</span>}
                  </div>
                  <div className="text-xs text-muted">{a.email}</div>
                </td>
                <td className={td}>
                  {owner && !me ? (
                    <ActionForm action={updateTeamMember}>
                      <input type="hidden" name="id" value={a.id} />
                      <select
                        name="role"
                        defaultValue={a.role}
                        aria-label={`Role for ${a.email}`}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="h-8 rounded-lg border border-line bg-card px-2 text-xs font-bold"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </ActionForm>
                  ) : (
                    <Badge tone={a.role === "owner" ? "dark" : a.role === "admin" ? "green" : "neutral"}>{ROLES.find((r) => r.value === a.role)?.label}</Badge>
                  )}
                </td>
                <td className={td}>{a.active ? <Badge tone="green">Active</Badge> : <Badge tone="danger">No access</Badge>}</td>
                <td className={td}>{a.twoFactorEnabled ? <Badge tone="green">On</Badge> : <Badge tone="warn">Off</Badge>}</td>
                <td className={`${td} whitespace-nowrap text-muted`}>{fmtAgo(a.lastLoginAt)}</td>
                <td className={`${td} whitespace-nowrap text-muted`}>{fmtDate(a.createdAt)}</td>
                {owner && (
                  <td className={`${td} text-right`}>
                    {!me && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPassword(tempPassword());
                            setResetFor(a);
                          }}
                        >
                          Reset password
                        </Button>
                        {a.twoFactorEnabled && (
                          <ActionForm action={updateTeamMember}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="resetTwoFactor" value="true" />
                            <ConfirmSubmit variant="ghost" prompt="Lost their phone? This turns off their 2FA." confirmLabel="Reset 2FA">
                              Reset 2FA
                            </ConfirmSubmit>
                          </ActionForm>
                        )}
                        <ActionForm action={updateTeamMember}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="active" value={String(!a.active)} />
                          <SubmitButton size="sm" variant="ghost">
                            {a.active ? "Remove access" : "Restore access"}
                          </SubmitButton>
                        </ActionForm>
                        <ActionForm action={deleteTeamMember}>
                          <input type="hidden" name="id" value={a.id} />
                          <ConfirmSubmit prompt="Delete?" confirmLabel="Delete">
                            Delete
                          </ConfirmSubmit>
                        </ActionForm>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </Table>

      <Dialog open={!!resetFor} onClose={() => setResetFor(null)} title={`Reset password for ${resetFor?.name ?? ""}`}>
        {resetFor && (
          <ActionForm action={updateTeamMember} onSuccess={() => setResetFor(null)} className="space-y-3">
            <input type="hidden" name="id" value={resetFor.id} />
            <p className="text-sm text-muted">They&apos;ll be signed out everywhere and need this password to get back in.</p>
            <input name="password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} className={cx(inputClass, "font-mono")} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setResetFor(null)}>
                Cancel
              </Button>
              <SubmitButton variant="primary" pendingLabel="Saving…">
                Set password
              </SubmitButton>
            </div>
          </ActionForm>
        )}
      </Dialog>
    </>
  );
}
