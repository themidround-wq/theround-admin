import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">404</p>
      <h1 className="text-2xl font-bold">Nothing here</h1>
      <p className="text-sm text-muted">That page or record doesn&apos;t exist, or it was deleted.</p>
      <Link href="/" className={buttonClass("primary")}>
        Back to overview
      </Link>
    </main>
  );
}
