import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "@/components/icons";
import { SearchForm } from "@/components/search-form";
import { Card, CardHeader, Empty, PageHeader, Pagination, Table, num, str, td, th } from "@/components/ui";
import { adminFetch, canEdit, currentAdmin } from "@/lib/api";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import type { Paged, Unsubscribe } from "@/lib/types";
import { AddUnsubscribe, Resubscribe } from "./unsubscribe-forms";

export const metadata: Metadata = { title: "Unsubscribes" };

const SOURCE = { link: "Email footer link", one_click: "Inbox unsubscribe button", admin: "Added by an admin" } as Record<string, string>;

export default async function UnsubscribesPage({ searchParams }: PageProps<"/newsletters/unsubscribes">) {
  const sp = await searchParams;
  const page = num(sp.page, 1);
  const limit = 50;
  const [data, admin] = await Promise.all([
    adminFetch<Paged<Unsubscribe>>("/unsubscribes", { query: { page, limit, search: str(sp.search) } }),
    currentAdmin(),
  ]);
  const editable = canEdit(admin);

  return (
    <>
      <Link href="/newsletters" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink">
        <ChevronIcon className="h-3 w-3 rotate-180" /> Newsletters
      </Link>
      <PageHeader
        eyebrow="Newsletters"
        title="Unsubscribes"
        description={`${fmtNumber(data.total)} addresses won't get newsletters, feature updates or announcements. Maintenance notices still reach app users.`}
      />
      {editable && (
        <Card className="mb-3">
          <CardHeader title="Unsubscribe someone" description="For people who asked another way, like replying to an email." />
          <AddUnsubscribe />
        </Card>
      )}
      <Card>
        <div className="flex justify-end border-b border-line-soft p-4">
          <SearchForm action="/newsletters/unsubscribes" params={sp} placeholder="Search emails" />
        </div>
        {data.items.length === 0 ? (
          <Empty title="Nobody has unsubscribed" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>Email</th>
                <th className={th}>How</th>
                <th className={th}>When</th>
                {editable && <th className={th} />}
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.email}>
                  <td className={td}>{u.email}</td>
                  <td className={`${td} text-muted`}>{SOURCE[u.source] ?? u.source}</td>
                  <td className={`${td} whitespace-nowrap text-muted`}>{fmtDateTime(u.createdAt)}</td>
                  {editable && (
                    <td className={`${td} text-right`}>
                      <Resubscribe email={u.email} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination base="/newsletters/unsubscribes" params={sp} page={page} limit={limit} total={data.total} />
      </Card>
    </>
  );
}
