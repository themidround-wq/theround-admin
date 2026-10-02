"use client";

import { changePassword, revokeOtherSessions, revokeSession, updateProfile, updateSetting } from "@/app/actions/admin";
import { logout } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { Badge, cx, inputClass } from "@/components/ui";
import { deviceOf, fmtAgo } from "@/lib/format";
import type { Session, Setting } from "@/lib/types";

export function SettingRow({ setting: s, editable }: { setting: Setting; editable: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-line-soft px-5 py-4">
      <div>
        <div className="text-sm font-bold">{s.label}</div>
        <p className="mt-0.5 text-xs text-muted">{s.description}</p>
        {s.updatedBy && (
          <p className="mt-1 text-[11px] text-muted/80">
            Changed {fmtAgo(s.updatedAt)} by {s.updatedBy}
          </p>
        )}
      </div>
      {s.type === "boolean" ? (
        <ActionForm action={updateSetting}>
          <input type="hidden" name="key" value={s.key} />
          <input type="hidden" name="value" value={String(!s.value)} />
          <Toggle on={s.value === true} disabled={!editable} label={s.label} />
        </ActionForm>
      ) : (
        <ActionForm action={updateSetting} className="flex shrink-0 rounded-lg border border-line p-0.5">
          <input type="hidden" name="key" value={s.key} />
          {s.options?.map((o) => (
            <button
              key={o}
              name="value"
              value={o}
              disabled={!editable || s.value === o}
              className={cx(
                "rounded-md px-2.5 py-1 text-xs font-bold",
                s.value === o ? "bg-ink text-cream" : "text-muted hover:text-ink disabled:hover:text-muted",
              )}
            >
              {o === 240 ? "4:00 Case" : "1:30 Quick"}
            </button>
          ))}
        </ActionForm>
      )}
    </div>
  );
}

function Toggle({ on, disabled, label }: { on: boolean; disabled: boolean; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={cx(
        "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        on ? "bg-moss" : "bg-line",
      )}
    >
      <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left]", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function ProfileForm({ name }: { name: string }) {
  return (
    <ActionForm action={updateProfile} className="flex gap-2 p-5 pt-3">
      <input name="name" defaultValue={name} required maxLength={80} aria-label="Your name" className={inputClass} />
      <SubmitButton variant="primary" pendingLabel="Saving…">
        Save
      </SubmitButton>
    </ActionForm>
  );
}

export function PasswordForm() {
  return (
    <ActionForm action={changePassword} resetOnSuccess className="space-y-2 p-5 pt-3">
      <input name="currentPassword" type="password" autoComplete="current-password" required placeholder="Current password" className={inputClass} />
      <input name="newPassword" type="password" autoComplete="new-password" required minLength={10} placeholder="New password (10+ characters)" className={inputClass} />
      <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={10} placeholder="Confirm new password" className={inputClass} />
      <div className="flex justify-end pt-1">
        <SubmitButton variant="primary" pendingLabel="Changing…">
          Change password
        </SubmitButton>
      </div>
    </ActionForm>
  );
}

export function SessionsList({ sessions }: { sessions: Session[] }) {
  const others = sessions.filter((s) => !s.current).length;
  return (
    <div className="mt-3">
      <ul>
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3">
            <div className="min-w-0 text-[13px]">
              <div className="flex items-center gap-2 font-bold">
                {deviceOf(s.userAgent)} {s.current && <Badge tone="lime">This device</Badge>}
              </div>
              <div className="text-xs text-muted">
                {s.ip ?? "Unknown IP"} · active {fmtAgo(s.lastSeenAt)}
              </div>
            </div>
            {s.current ? (
              <form action={logout}>
                <SubmitButton size="sm" variant="secondary">
                  Sign out
                </SubmitButton>
              </form>
            ) : (
              <ActionForm action={revokeSession}>
                <input type="hidden" name="id" value={s.id} />
                <SubmitButton size="sm" variant="danger-ghost">
                  Sign out
                </SubmitButton>
              </ActionForm>
            )}
          </li>
        ))}
      </ul>
      {others > 0 && (
        <ActionForm action={revokeOtherSessions} className="border-t border-line-soft px-5 py-3">
          <SubmitButton size="sm" variant="danger-ghost" pendingLabel="Signing out…">
            Sign out of {others} other session{others === 1 ? "" : "s"}
          </SubmitButton>
        </ActionForm>
      )}
    </div>
  );
}
