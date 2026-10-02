import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { Badge, Card, Empty, PageHeader, Pagination, Segmented, Table, num, str, td, th, withParams } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { fmtAgo, fmtDate, fmtNumber } from "@/lib/format";
import type { Paged, UserRow } from "@/lib/types";
import { Avatar } from "./avatar";

export const metadata: Metadata = { title: "Users" };

const STATUSES = [
  { value: "", label: "All" },
  { value: "onboarded", label: "Onboarded" },
  { value: "onboarding", label: "Onboarding" },
  { value: "suspended", label: "Suspended" },
];
const STAGES = [
  { value: "", label: "Any stage" },
  { value: "student", label: "Students" },
  { value: "qualified", label: "Qualified" },
];

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const sp = await searchParams;
  const page = num(sp.page, 1);
  const limit = 50;
  const status = str(sp.status) ?? "";
  const stage = str(sp.stage) ?? "";
  const data = await adminFetch<Paged<UserRow>>("/users", {
    query: { page, limit, status, stage, search: str(sp.search) },
  });

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Users"
        description={`${fmtNumber(data.total)} ${status || stage ? "matching" : ""} accounts. People who signed in to the app with Google.`}
      />
      {sp.deleted && (
        <p className="mb-3 rounded-xl border border-line bg-card px-4 py-3 text-sm">The user and all their recordings were deleted.</p>
      )}
      <Card>
        <div className="flex flex-col gap-3 border-b border-line-soft p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Segmented options={STATUSES} value={status} hrefFor={(v) => withParams("/users", sp, { status: v, page: undefined })} />
            <Segmented options={STAGES} value={stage} hrefFor={(v) => withParams("/users", sp, { stage: v, page: undefined })} />
          </div>
          <SearchForm action="/users" params={sp} placeholder="Search name or email" />
        </div>
        {data.items.length === 0 ? (
          <Empty title="No users match">Try another filter, or clear the search.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={th}>User</th>
                <th className={th}>Course</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Saved rounds</th>
                <th className={th}>Last practice</th>
                <th className={th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} className="hover:bg-canvas/60">
                  <td className={td}>
                    <Link href={`/users/${u.id}`} className="flex items-center gap-3">
                      <Avatar user={u} />
                      <span className="min-w-0">
                        <span className="block font-bold hover:underline">{u.name ?? "No name yet"}</span>
                        <span className="block max-w-[240px] truncate text-xs text-muted">{u.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={td}>
                    {u.course ? (
                      <>
                        {u.course}
                        <div className="text-xs text-muted">{[u.stage, u.year].filter(Boolean).join(" · ")}</div>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className={td}>
                    {u.suspendedAt ? (
                      <Badge tone="danger">Suspended</Badge>
                    ) : u.onboarded ? (
                      <Badge tone="green">Onboarded</Badge>
                    ) : (
                      <Badge>Onboarding</Badge>
                    )}
                  </td>
                  <td className={`${td} num text-right font-bold`}>{u.roundsSaved}</td>
                  <td className={`${td} whitespace-nowrap text-muted`}>{fmtAgo(u.lastRoundAt)}</td>
                  <td className={`${td} whitespace-nowrap text-muted`}>{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination base="/users" params={sp} page={page} limit={limit} total={data.total} />
      </Card>
    </>
  );
}
