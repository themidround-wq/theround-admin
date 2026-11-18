import type { Metadata } from "next";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { adminFetch, canEdit, currentAdmin } from "@/lib/api";
import type { AiStatus, Session, Setting } from "@/lib/types";
import { Badge } from "@/components/ui";
import { PasswordForm, ProfileForm, SessionsList, SettingRow } from "./settings-ui";
import { TwoFactorCard, type TwoFactorStatus } from "./two-factor";

export const metadata: Metadata = { title: "Settings" };

const GROUPS = [
  { title: "Access", description: "Who can get in to the product.", prefix: ["waitlist.", "signups."] },
  { title: "Practice", description: "Defaults for new accounts.", prefix: ["practice."] },
  { title: "Email", description: "Automatic emails sent through Resend. Launch invites are sent by hand from the Waitlist page.", prefix: ["email."] },
  { title: "AI marking", description: "How practice answers are transcribed and marked. Keys live in the API's environment (see its .env.example).", prefix: ["ai."] },
];

const usd = (n: number) => (n < 0.01 && n > 0 ? "< $0.01" : `$${n.toFixed(2)}`);

function AiStatusPanel({ ai }: { ai: AiStatus }) {
  const u = ai.usage.last30Days;
  const missing = [ai.transcription.missing, ai.marking.missing].filter(Boolean);
  const modelName = ai.marking.model === "open" ? ai.marking.openModelName ?? "open-source model (not set)" : ai.marking.model;
  return (
    <div className="mx-5 mt-3 space-y-2 rounded-xl bg-canvas p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        {!ai.enabled ? (
          <Badge>Off: placeholder scorer</Badge>
        ) : missing.length ? (
          <Badge tone="warn">On, but not configured: {missing.join(", ")}</Badge>
        ) : (
          <Badge tone="green">Live</Badge>
        )}
        <span className="text-muted">
          {ai.transcription.provider} → {modelName}
        </span>
      </div>
      <p className="num text-muted">
        Today: <b className="text-ink">{ai.usage.today.aiMarked}</b> AI-marked ({usd(ai.usage.today.costUsd)}). Last 30 days:{" "}
        <b className="text-ink">{u.aiMarked}</b> AI-marked ({usd(u.costUsd)} marking, est.), {u.placeholder} placeholder, average score {u.averageScore ?? "–"}, {u.flagged} flagged.
      </p>
      {u.fallbacks > 0 && (
        <p className="text-warn">
          {u.fallbacks} answer{u.fallbacks === 1 ? "" : "s"} fell back to the placeholder. Latest: {u.lastFallbackReason}
        </p>
      )}
    </div>
  );
}

export default async function SettingsPage() {
  const [settings, sessions, admin, twoFactor, ai] = await Promise.all([
    adminFetch<Setting[]>("/settings"),
    adminFetch<Session[]>("/auth/sessions"),
    currentAdmin(),
    adminFetch<TwoFactorStatus>("/auth/2fa"),
    adminFetch<AiStatus>("/ai").catch(() => null), // older API without AI marking
  ]);
  const editable = canEdit(admin);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Settings" description="Switches that change how the round behaves, plus your own account." />

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3">
          {GROUPS.map((g) => (
            <Card key={g.title}>
              <CardHeader title={g.title} description={g.description} />
              {g.prefix[0] === "ai." && ai && <AiStatusPanel ai={ai} />}
              <div className="mt-3">
                {settings
                  .filter((s) => g.prefix.some((p) => s.key.startsWith(p)))
                  .map((s) => (
                    <SettingRow key={s.key} setting={s} editable={editable} />
                  ))}
              </div>
            </Card>
          ))}
          {!editable && <p className="px-1 text-xs text-muted">Viewers can see settings but not change them.</p>}
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader title="Your profile" description={`${admin.email} · ${admin.role}`} />
            <ProfileForm name={admin.name} />
          </Card>
          <Card id="two-factor">
            <CardHeader title="Two-factor authentication" description="A code from your phone on every sign-in." />
            <TwoFactorCard status={twoFactor} email={admin.email} />
          </Card>
          <Card>
            <CardHeader title="Password" description="Changing it signs out your other sessions." />
            <PasswordForm />
          </Card>
          <Card>
            <CardHeader title="Where you're signed in" description="Sessions last 12 hours." />
            <SessionsList sessions={sessions} />
          </Card>
        </div>
      </div>
    </>
  );
}
