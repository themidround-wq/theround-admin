"use client";

import { useState, useTransition } from "react";
import { confirmTwoFactor, disableTwoFactor, newRecoveryCodes, refreshPage, startTwoFactorSetup } from "@/app/actions/admin";
import { ActionForm, useToast } from "@/components/action-form";
import { Dialog } from "@/components/dialog";
import { CheckIcon, CopyIcon, DownloadIcon, ShieldIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Button, cx, inputClass } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export type TwoFactorStatus = { enabled: boolean; enabledAt: string | null; recoveryCodesLeft: number };

const codeInput = cx(inputClass, "num h-11 text-center text-lg tracking-[0.35em]");

export function TwoFactorCard({ status, email }: { status: TwoFactorStatus; email: string }) {
  const [dialog, setDialog] = useState<"setup" | "codes" | "disable" | null>(null);

  return (
    <div className="p-5 pt-3">
      {status.enabled ? (
        <>
          <div className="flex items-center gap-2 text-sm">
            <Badge tone="green">
              <CheckIcon className="mr-1 h-3 w-3" /> On
            </Badge>
            <span className="text-muted">since {fmtDate(status.enabledAt)}</span>
          </div>
          <p className={cx("mt-2 text-xs", status.recoveryCodesLeft <= 3 ? "font-bold text-danger" : "text-muted")}>
            {status.recoveryCodesLeft} recovery code{status.recoveryCodesLeft === 1 ? "" : "s"} left.
            {status.recoveryCodesLeft <= 3 && " Make new ones soon."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDialog("codes")}>
              New recovery codes
            </Button>
            <Button size="sm" variant="danger-ghost" onClick={() => setDialog("disable")}>
              Turn off
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Add a code from Google Authenticator (or 1Password, Authy, Microsoft Authenticator) to every sign-in, so a leaked password
            isn&apos;t enough to get in.
          </p>
          <Button className="mt-3" variant="primary" onClick={() => setDialog("setup")}>
            <ShieldIcon className="h-4 w-4" /> Set up two-factor
          </Button>
        </>
      )}

      <Dialog open={dialog === "setup"} onClose={() => (setDialog(null), void refreshPage())} title="Set up two-factor">
        <SetupFlow email={email} onDone={() => setDialog(null)} />
      </Dialog>
      <Dialog open={dialog === "codes"} onClose={() => (setDialog(null), void refreshPage())} title="New recovery codes">
        <RegenerateFlow onDone={() => setDialog(null)} />
      </Dialog>
      <Dialog open={dialog === "disable"} onClose={() => setDialog(null)} title="Turn off two-factor?">
        <ActionForm action={disableTwoFactor} onSuccess={() => setDialog(null)} className="space-y-3">
          <p className="text-sm text-muted">Your account will be protected by your password only.</p>
          <input name="password" type="password" required autoComplete="current-password" placeholder="Your password" className={inputClass} />
          <input name="code" required autoComplete="one-time-code" placeholder="App code or recovery code" className={inputClass} />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <SubmitButton variant="danger" pendingLabel="Turning off…">
              Turn off
            </SubmitButton>
          </div>
        </ActionForm>
      </Dialog>
    </div>
  );
}

/** Scan → confirm a code → save recovery codes. */
function SetupFlow({ email, onDone }: { email: string; onDone: () => void }) {
  const [setup, setSetup] = useState<{ secret: string; qrSvg: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (codes) return <RecoveryCodes codes={codes} email={email} onDone={() => (onDone(), void refreshPage())} />;

  if (!setup) {
    return (
      <div className="space-y-3 text-sm">
        <ol className="list-decimal space-y-1.5 pl-5 text-muted">
          <li>Install Google Authenticator (or any authenticator app) on your phone.</li>
          <li>Scan the QR code we show you next.</li>
          <li>Type the 6-digit code it shows to confirm.</li>
          <li>Save your recovery codes somewhere safe.</li>
        </ol>
        {error && <p className="text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button
            variant="primary"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await startTwoFactorSetup();
                if (r.ok) setSetup(r);
                else setError(r.message);
              })
            }
          >
            {pending ? "Preparing…" : "Show QR code"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await confirmTwoFactor(code);
          if (r.ok) setCodes(r.recoveryCodes);
          else setError(r.message);
        });
      }}
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        {/* SVG generated server-side from our own otpauth:// URI. */}
        <div className="h-44 w-44 shrink-0 rounded-xl border border-line p-2" dangerouslySetInnerHTML={{ __html: setup.qrSvg }} />
        <div className="text-sm">
          <p className="font-bold">Scan with your authenticator app</p>
          <p className="mt-1 text-xs text-muted">Can&apos;t scan? Choose &ldquo;Enter a setup key&rdquo; and type:</p>
          <code className="num mt-2 block break-all rounded-lg bg-canvas px-2.5 py-2 text-xs font-bold tracking-wider">
            {setup.secret.match(/.{1,4}/g)?.join(" ")}
          </code>
          <p className="mt-1 text-[11px] text-muted">Time based · 6 digits · account: {email}</p>
        </div>
      </div>
      <label className="block text-xs font-bold text-muted">
        Code from the app
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="123456"
          className={cx(codeInput, "mt-1")}
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending || code.length !== 6}>
          {pending ? "Checking…" : "Turn on"}
        </Button>
      </div>
    </form>
  );
}

function RegenerateFlow({ onDone }: { onDone: () => void }) {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (codes) return <RecoveryCodes codes={codes} onDone={() => (onDone(), void refreshPage())} />;
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await newRecoveryCodes(code);
          if (r.ok) setCodes(r.recoveryCodes);
          else setError(r.message);
        });
      }}
    >
      <p className="text-sm text-muted">Your old recovery codes stop working. Enter a current code from your app to continue.</p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        placeholder="123456"
        className={codeInput}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={pending || code.length !== 6}>
          {pending ? "Checking…" : "Make new codes"}
        </Button>
      </div>
    </form>
  );
}

/** Shown once. Can't be closed until they confirm they saved them. */
function RecoveryCodes({ codes, email, onDone }: { codes: string[]; email?: string; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const toast = useToast();
  const text = [
    "The Round admin: two-factor recovery codes",
    email ? `Account: ${email}` : "",
    `Created: ${new Date().toISOString().slice(0, 10)}`,
    "Each code works once. Keep them somewhere safe.",
    "",
    ...codes,
  ]
    .filter((l, i) => l || i > 3)
    .join("\n");

  return (
    <div className="space-y-4">
      <p className="text-sm">
        <b>Save these now.</b> If you lose your phone, each code gets you in once. They won&apos;t be shown again.
      </p>
      <ul className="num grid grid-cols-2 gap-1.5 rounded-xl bg-canvas p-3 font-mono text-sm">
        {codes.map((c) => (
          <li key={c} className="rounded-md bg-card px-2 py-1 text-center">
            {c}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigator.clipboard.writeText(text).then(() => toast({ ok: true, message: "Copied." }))}
        >
          <CopyIcon className="h-3.5 w-3.5" /> Copy
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
            a.download = "theround-admin-recovery-codes.txt";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          <DownloadIcon className="h-3.5 w-3.5" /> Download
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="h-4 w-4 accent-[#14271a]" />
        I&apos;ve saved my recovery codes
      </label>
      <div className="flex justify-end">
        <Button variant="primary" disabled={!saved} onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}
