"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { ArrowIcon } from "@/components/icons";

const field =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-lime/60 focus:ring-2 focus:ring-lime/20";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block text-xs font-medium text-cream/70">
        Email
        <input name="email" type="email" autoComplete="username" required autoFocus className={field} placeholder="you@gettheround.com" />
      </label>
      <label className="block text-xs font-medium text-cream/70">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-[#3a1610] px-3 py-2 text-sm text-[#ffb4a6]">
          {state.message}
        </p>
      )}
      <button
        disabled={pending}
        className="cut-corner flex w-full items-center justify-between rounded-md bg-cream py-1.5 pl-5 pr-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-night transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-cream">
          <ArrowIcon className="h-3.5 w-3.5" />
        </span>
      </button>
    </form>
  );
}
