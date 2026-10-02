import type { Metadata } from "next";
import Image from "next/image";
import Logo from "@/public/Logo-on-darkbg.png";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const notice = sp.expired
    ? "Your session ended. Sign in again."
    : sp.signedOut
      ? "You've signed out."
      : null;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night px-4 py-12">
      {/* Soft lime glow, echoing the landing page hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-lime/10 blur-3xl"
      />
      <div className="relative w-full max-w-sm">
        <Image src={Logo} alt="the round" className="mx-auto mb-10 w-[140px]" priority />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-sm">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.14em]">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            <span className="text-cream/95">Founder control room</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-cream">Sign in</h1>
          <p className="mt-1 text-sm text-cream/55">Admin access to the round.</p>
          {notice && (
            <p className="mt-5 rounded-lg border border-lime/25 bg-lime/10 px-3 py-2 text-sm text-lime">
              {notice}
            </p>
          )}
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-cream/40">
          Know it. Say it. Practice it.
        </p>
      </div>
    </main>
  );
}
