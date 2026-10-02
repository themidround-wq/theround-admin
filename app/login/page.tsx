import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";
  const notice = sp.expired
    ? "Your session ended. Sign in again."
    : sp.signedOut
      ? "You've signed out."
      : sp.reset
        ? "Password changed. Sign in with your new password."
        : null;

  return (
    <AuthShell title="Sign in" subtitle="Admin access to the round.">
      <LoginForm next={next} notice={notice} />
    </AuthShell>
  );
}
