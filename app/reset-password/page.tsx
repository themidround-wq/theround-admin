import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "./reset-form";

// The token is in the URL: never send it on as a Referer.
export const metadata: Metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";

  return (
    <AuthShell title="Choose a new password" subtitle="You'll be signed out everywhere. Two-factor stays on if you use it.">
      {token ? (
        <ResetForm token={token} />
      ) : (
        <div className="mt-6 space-y-4 text-sm text-cream/70">
          <p>This link is incomplete. Open the link from the email again, or ask for a new one.</p>
          <Link href="/forgot-password" className="block text-center text-xs underline hover:text-cream">
            Request a new link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
