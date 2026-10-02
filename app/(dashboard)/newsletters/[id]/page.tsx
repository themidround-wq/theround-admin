import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronIcon } from "@/components/icons";
import { ApiError, adminFetch, canEdit, currentAdmin } from "@/lib/api";
import type { AudienceOption, Broadcast, BroadcastRecipient, Paged } from "@/lib/types";
import { BroadcastEditor } from "./broadcast-editor";
import { BroadcastReport } from "./broadcast-report";
import { num, str } from "@/components/ui";

export const metadata: Metadata = { title: "Newsletter" };

export default async function BroadcastPage({ params, searchParams }: PageProps<"/newsletters/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [broadcast, admin] = await Promise.all([
    adminFetch<Broadcast>(`/broadcasts/${id}`).catch((e) => {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    }),
    currentAdmin(),
  ]);

  const back = (
    <Link href="/newsletters" className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
      <ChevronIcon className="h-3 w-3 rotate-180" /> Newsletters
    </Link>
  );

  if (broadcast.status === "draft" || broadcast.status === "scheduled") {
    const [standard, maintenance] = await Promise.all([
      adminFetch<AudienceOption[]>("/broadcasts/audiences", { query: { kind: "newsletter" } }),
      adminFetch<AudienceOption[]>("/broadcasts/audiences", { query: { kind: "maintenance" } }),
    ]);
    return (
      <>
        {back}
        <BroadcastEditor broadcast={broadcast} audiences={{ standard, maintenance }} adminEmail={admin.email} editable={canEdit(admin)} />
      </>
    );
  }

  const page = num(sp.page, 1);
  const status = str(sp.status) ?? "";
  const [recipients, preview, audiences] = await Promise.all([
    adminFetch<Paged<BroadcastRecipient>>(`/broadcasts/${id}/recipients`, {
      query: { page, limit: 50, status, search: str(sp.search) },
    }),
    adminFetch<{ html: string }>("/broadcasts/preview", {
      method: "POST",
      body: {
        kind: broadcast.kind,
        subject: broadcast.subject,
        preheader: broadcast.preheader,
        headline: broadcast.headline,
        bodyHtml: broadcast.bodyHtml,
        ctaLabel: broadcast.ctaLabel,
        ctaUrl: broadcast.ctaUrl,
      },
    }),
    adminFetch<AudienceOption[]>("/broadcasts/audiences"),
  ]);

  return (
    <>
      {back}
      <BroadcastReport
        broadcast={broadcast}
        recipients={recipients}
        previewHtml={preview.html}
        audienceLabel={audiences.find((a) => a.key === broadcast.audience)?.label ?? broadcast.audience}
        editable={canEdit(admin)}
        params={sp}
      />
    </>
  );
}
