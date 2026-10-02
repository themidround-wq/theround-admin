import type { Metadata } from "next";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { adminFetch, canEdit, currentAdmin } from "@/lib/api";
import type { Session, Setting } from "@/lib/types";
import { PasswordForm, ProfileForm, SessionsList, SettingRow } from "./settings-ui";
import { TwoFactorCard, type TwoFactorStatus } from "./two-factor";

export const metadata: Metadata = { title: "Settings" };

const GROUPS = [
  { title: "Access", description: "Who can get in to the product.", prefix: ["waitlist.", "signups."] },
  { title: "Practice", description: "Defaults for new accounts.", prefix: ["practice."] },
  { title: "Email", description: "Automatic emails sent through Resend. Launch invites are sent by hand from the Waitlist page.", prefix: ["email."] },
];

export default async function SettingsPage() {
  const [settings, sessions, admin, twoFactor] = await Promise.all([
    adminFetch<Setting[]>("/settings"),
    adminFetch<Session[]>("/auth/sessions"),
    currentAdmin(),
    adminFetch<TwoFactorStatus>("/auth/2fa"),
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
