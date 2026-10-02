import { ToastProvider } from "@/components/action-form";
import { Sidebar } from "@/components/sidebar";
import { currentAdmin } from "@/lib/api";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const admin = await currentAdmin();
  return (
    <ToastProvider>
      <Sidebar admin={admin} />
      <main className="min-h-screen lg:pl-[248px]">
        <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {!admin.twoFactorEnabled && (
            <a
              href="/settings#two-factor"
              className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-warn/25 bg-warn-soft px-4 py-2.5 text-sm text-warn hover:border-warn/50"
            >
              <span>
                <b>Protect your account:</b> turn on two-factor authentication with Google Authenticator.
              </span>
              <span className="shrink-0 font-bold">Set up →</span>
            </a>
          )}
          {children}
        </div>
      </main>
    </ToastProvider>
  );
}
