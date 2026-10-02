import { ToastProvider } from "@/components/action-form";
import { Sidebar } from "@/components/sidebar";
import { currentAdmin } from "@/lib/api";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const admin = await currentAdmin();
  return (
    <ToastProvider>
      <Sidebar admin={admin} />
      <main className="min-h-screen lg:pl-[248px]">
        <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">{children}</div>
      </main>
    </ToastProvider>
  );
}
