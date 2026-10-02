import Image from "next/image";
import type { ReactNode } from "react";
import Logo from "@/public/Logo-on-darkbg.png";

/** Dark, centred card used by sign-in, forgot and reset password. */
export function AuthShell({
  title,
  subtitle,
  notice,
  children,
}: {
  title: string;
  subtitle: string;
  notice?: string | null;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night px-4 py-12">
      {/* Soft lime glow, echoing the landing page hero. */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-lime/10 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <Image src={Logo} alt="the round" className="mx-auto mb-10 w-[140px]" priority />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.14em]">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            <span className="text-cream/95">Founder control room</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cream">{title}</h1>
          <p className="mt-1 text-sm text-cream/55">{subtitle}</p>
          {notice && <p className="mt-5 rounded-lg border border-lime/25 bg-lime/10 px-3 py-2 text-sm text-lime">{notice}</p>}
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-cream/40">Know it. Say it. Practice it.</p>
      </div>
    </main>
  );
}

export const authField =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-lime/60 focus:ring-2 focus:ring-lime/20";

export const authError = "rounded-lg bg-[#3a1610] px-3 py-2 text-sm text-[#ffb4a6]";

export const authButton =
  "cut-corner flex w-full items-center justify-between rounded-md bg-cream py-1.5 pl-5 pr-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-night transition-transform hover:scale-[1.01] disabled:opacity-60";
