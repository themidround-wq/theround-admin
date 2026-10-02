import type { Metadata } from "next";
import { DownloadIcon } from "@/components/icons";
import { SearchForm } from "@/components/search-form";
import { Card, PageHeader, Pagination, Segmented, buttonClass, num, str, withParams } from "@/components/ui";
import { adminFetch, canEdit, currentAdmin } from "@/lib/api";
import { fmtNumber } from "@/lib/format";
import type { Paged, WaitlistEntry } from "@/lib/types";
import { AddEmails } from "./add-emails";
import { WaitlistTable } from "./waitlist-table";

export const metadata: Metadata = { title: "Waitlist" };

const STATUSES = [
  { value: "", label: "All" },
  { value: "pending", label: "Not invited" },
  { value: "invited", label: "Invited" },
  { value: "joined", label: "Has account" },
];

export default async function WaitlistPage({ searchParams }: PageProps<"/waitlist">) {
  const sp = await searchParams;
  const page = num(sp.page, 1);
  const status = str(sp.status) ?? "";
  const limit = 50;
  const [data, admin] = await Promise.all([
    adminFetch<Paged<WaitlistEntry>>("/waitlist", { query: { page, limit, status, search: str(sp.search) } }),
    currentAdmin(),
  ]);
  const editable = canEdit(admin);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Waitlist"
        description={`${fmtNumber(data.total)} ${status ? `${STATUSES.find((s) => s.value === status)?.label.toLowerCase()} ` : ""}on the list. Ticket numbers match the ones in their confirmation email.`}
        actions={
          <>
            <a href="/waitlist/export" className={buttonClass("secondary")}>
              <DownloadIcon className="h-4 w-4" /> Export CSV
            </a>
            {editable && <AddEmails />}
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-line-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <Segmented options={STATUSES} value={status} hrefFor={(v) => withParams("/waitlist", sp, { status: v, page: undefined })} />
          <SearchForm action="/waitlist" params={sp} placeholder="Search emails" />
        </div>
        <WaitlistTable items={data.items} editable={editable} />
        <Pagination base="/waitlist" params={sp} page={page} limit={limit} total={data.total} />
      </Card>
    </>
  );
}
