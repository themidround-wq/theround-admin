"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword } from "@/app/actions/auth";
import { authButton, authError, authField } from "@/components/auth-shell";
import { ArrowIcon } from "@/components/icons";

export function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPassword, null);

  if (state?.ok) {
    return (
      <div className="mt-6 space-y-4">
        <p role="status" className="rounded-lg border border-lime/25 bg-lime/10 px-3 py-2 text-sm text-lime">
          {state.message}
        </p>
        <p className="text-xs text-cream/55">Nothing after a few minutes? Check spam, or ask an owner to reset your password from the Team page.</p>
        <Link href="/login" className="block text-center text-xs text-cream/60 underline hover:text-cream">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-xs font-medium text-cream/70">
        Email
        <input name="email" type="email" autoComplete="username" required autoFocus className={authField} placeholder="you@gettheround.com" />
      </label>
      {state && !state.ok && (
        <p role="alert" className={authError}>
          {state.message}
        </p>
      )}
      <button disabled={pending} className={authButton}>
        {pending ? "Sending…" : "Send reset link"}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-cream">
          <ArrowIcon className="h-3.5 w-3.5" />
        </span>
      </button>
      <Link href="/login" className="block text-center text-xs text-cream/60 underline hover:text-cream">
        Back to sign in
      </Link>
    </form>
  );
}
