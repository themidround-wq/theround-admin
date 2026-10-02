"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";
import { authButton, authError, authField } from "@/components/auth-shell";
import { ArrowIcon } from "@/components/icons";

export function LoginForm({ next, notice }: { next: string; notice: string | null }) {
  const [state, action, pending] = useActionState(login, null);
  const [useRecovery, setUseRecovery] = useState(false);

  if (state?.step === "code") {
    return (
      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="challenge" value={state.challenge} />
        <p className="text-sm text-cream/70">
          {useRecovery
            ? "Enter one of the recovery codes you saved when you set up two-factor. Each works once."
            : "Open your authenticator app and enter the 6-digit code for The Round Admin."}
        </p>
        <label className="block text-xs font-medium text-cream/70">
          {useRecovery ? "Recovery code" : "Authentication code"}
          <input
            key={useRecovery ? "recovery" : "totp"}
            name="code"
            required
            autoFocus
            autoComplete="one-time-code"
            inputMode={useRecovery ? "text" : "numeric"}
            pattern={useRecovery ? undefined : "[0-9 ]{6,7}"}
            maxLength={useRecovery ? 14 : 7}
            placeholder={useRecovery ? "abcd-efgh-jk" : "123 456"}
            className={`${authField} num text-center text-lg tracking-[0.3em]`}
          />
        </label>
        {state.error && (
          <p role="alert" className={authError}>
            {state.error}
          </p>
        )}
        <button disabled={pending} className={authButton}>
          {pending ? "Checking…" : "Verify"}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-cream">
            <ArrowIcon className="h-3.5 w-3.5" />
          </span>
        </button>
        <div className="flex justify-between text-xs">
          <button type="button" onClick={() => setUseRecovery(!useRecovery)} className="text-cream/60 underline hover:text-cream">
            {useRecovery ? "Use the app instead" : "Lost your phone? Use a recovery code"}
          </button>
          <a href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-cream/60 hover:text-cream">
            Start over
          </a>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      {notice && !state && <p className="rounded-lg border border-lime/25 bg-lime/10 px-3 py-2 text-sm text-lime">{notice}</p>}
      <input type="hidden" name="next" value={next} />
      <label className="block text-xs font-medium text-cream/70">
        Email
        <input name="email" type="email" autoComplete="username" required autoFocus className={authField} placeholder="you@gettheround.com" />
      </label>
      <div>
        <div className="flex justify-between text-xs font-medium text-cream/70">
          <label htmlFor="password">Password</label>
          <Link href="/forgot-password" className="font-normal text-cream/55 hover:text-lime">
            Forgot password?
          </Link>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={authField} />
      </div>
      {state?.step === "password" && (
        <p role="alert" className={authError}>
          {state.error}
        </p>
      )}
      <button disabled={pending} className={authButton}>
        {pending ? "Signing in…" : "Sign in"}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-cream">
          <ArrowIcon className="h-3.5 w-3.5" />
        </span>
      </button>
    </form>
  );
}
