"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { authButton, authError, authField } from "@/components/auth-shell";
import { ArrowIcon } from "@/components/icons";

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-xs font-medium text-cream/70">
        New password
        <input name="password" type="password" autoComplete="new-password" minLength={10} required autoFocus className={authField} />
      </label>
      <label className="block text-xs font-medium text-cream/70">
        Confirm new password
        <input name="confirm" type="password" autoComplete="new-password" minLength={10} required className={authField} />
      </label>
      <p className="text-xs text-cream/45">At least 10 characters. A short sentence works well.</p>
      {state && !state.ok && (
        <p role="alert" className={authError}>
          {state.message}{" "}
          {/expired|used/.test(state.message) && (
            <Link href="/forgot-password" className="underline">
              Get a new link
            </Link>
          )}
        </p>
      )}
      <button disabled={pending} className={authButton}>
        {pending ? "Saving…" : "Set new password"}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-cream">
          <ArrowIcon className="h-3.5 w-3.5" />
        </span>
      </button>
    </form>
  );
}
