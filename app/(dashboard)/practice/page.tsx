import type { Metadata } from "next";
import Link from "next/link";
import { BarList, ColumnChart, dayLabels } from "@/components/charts";
import { SearchForm } from "@/components/search-form";
import { Card, CardHeader, PageHeader, Pagination, Segmented, Stat, num, str, withParams } from "@/components/ui";
import { adminFetch, canEdit, currentAdmin } from "@/lib/api";
import { REFLECTION_LABEL, fmtDuration, fmtNumber, pct } from "@/lib/format";
import type { Activity, CatalogCategory, Paged, Round } from "@/lib/types";
import { RoundsTable } from "./rounds-table";

export const metadata: Metadata = { title: "Practice" };

const RANGES = [
  { value: "7", label: "7d" },
  { value: "14", label: "14d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
];
const STATUSES = [
  { value: "", label: "All" },
  { value: "saved", label: "Saved" },
  { value: "completed", label: "Not saved" },
  { value: "in_progress", label: "In progress" },
  { value: "spun", label: "Spun only" },
];

export default async function PracticePage({ searchParams }: PageProps<"/practice">) {
  const sp = await searchParams;
  const days = ["7", "14", "30", "90"].includes(String(sp.days)) ? Number(sp.days) : 30;
  const page = num(sp.page, 1);
  const limit = 25;
  const status = str(sp.status) ?? "";
  const categoryId = str(sp.categoryId) ?? "";

  const [activity, rounds, catalog, admin] = await Promise.all([
    adminFetch<Activity>("/activity", { query: { days } }),
    adminFetch<Paged<Round>>("/rounds", {
      query: { page, limit, status, categoryId, userId: str(sp.userId), search: str(sp.search) },
    }),
    adminFetch<CatalogCategory[]>("/catalog"),
    currentAdmin(),
  ]);
  const f = activity.funnel;
  const today = new Date().toISOString().slice(0, 10);
  const totalReflections = Object.values(activity.reflections).reduce((a, b) => a + b, 0);
  const categoryOptions = [{ value: "", label: "All categories" }, ...catalog.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Practice"
        description="Spin → Speak → Listen → Save. How students move through the practice loop."
        actions={<Segmented options={RANGES} value={String(days)} hrefFor={(v) => withParams("/practice", sp, { days: v === "30" ? undefined : v })} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="dark" label="Saved rounds" value={fmtNumber(f.saved)} sub={`last ${days} days`} />
        <Stat label="Practising users" value={fmtNumber(activity.practisingUsers)} sub="saved at least one round" />
        <Stat label="Spin → save" value={`${pct(f.saved, f.spun)}%`} sub={`${fmtNumber(f.spun)} spins`} />
        <Stat
          label="Avg. answer"
          value={fmtDuration(activity.avgSpokenSeconds)}
          sub={`${pct(activity.length.case, activity.length.quick + activity.length.case)}% chose 4:00 Case`}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Saved rounds per day" description="UTC days, today in dark" />
          <div className="px-5 pb-5 pt-6">
            <ColumnChart
              unit="rounds"
              data={activity.series.map((d) => ({ ...dayLabels(d.date), value: d.rounds, highlight: d.date === today }))}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Practice loop" description="Of every round spun in the window" />
          <div className="p-5">
            <BarList
              max={f.spun}
              items={[
                { label: "Spun", value: f.spun },
                { label: "Started speaking", value: f.started, note: `${pct(f.started, f.spun)}%` },
                { label: "Finished & listened", value: f.completed, note: `${pct(f.completed, f.spun)}%` },
                { label: "Saved", value: f.saved, note: `${pct(f.saved, f.spun)}%` },
              ]}
            />
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Saved rounds by category" description="Where practice time goes" />
          <div className="p-5">
            <BarList items={[...activity.categories].sort((a, b) => b.rounds - a.rounds).map((c) => ({ label: c.name, value: c.rounds }))} />
          </div>
        </Card>
        <Card>
          <CardHeader title="How it felt" description="Reflection picked after saving" />
          <div className="p-5">
            <BarList
              max={totalReflections}
              items={["clear", "a_little_unsure", "lost_my_structure", "want_another_go", "none"].map((k) => ({
                label: REFLECTION_LABEL[k],
                value: activity.reflections[k] ?? 0,
                note: `${pct(activity.reflections[k] ?? 0, totalReflections)}%`,
                muted: k === "none",
              }))}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-3">
        <CardHeader
          title="Rounds"
          description={
            sp.userId ? (
              <>
                One user&apos;s rounds ·{" "}
                <Link href={withParams("/practice", sp, { userId: undefined, page: undefined })} className="font-bold text-moss hover:underline">
                  show everyone
                </Link>
              </>
            ) : (
              "Open a round to read the note, play the recording or delete it."
            )
          }
        />
        <div className="flex flex-col gap-3 border-b border-line-soft p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <Segmented options={STATUSES} value={status} hrefFor={(v) => withParams("/practice", sp, { status: v, page: undefined })} />
            <CategoryFilter options={categoryOptions} value={categoryId} sp={sp} />
          </div>
          <SearchForm action="/practice" params={sp} placeholder="Search email, topic or question" />
        </div>
        <RoundsTable rounds={rounds.items} editable={canEdit(admin)} />
        <Pagination base="/practice" params={sp} page={page} limit={limit} total={rounds.total} />
      </Card>
    </>
  );
}

/** Plain GET form, so filtering works without client JS. */
function CategoryFilter({
  options,
  value,
  sp,
}: {
  options: { value: string; label: string }[];
  value: string;
  sp: Record<string, string | string[] | undefined>;
}) {
  const keep = Object.entries(sp).filter(([k, v]) => k !== "categoryId" && k !== "page" && typeof v === "string" && v);
  return (
    <form action="/practice" className="flex items-center gap-1.5">
      {keep.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v as string} />
      ))}
      <select
        name="categoryId"
        defaultValue={value}
        aria-label="Category"
        className="h-[30px] rounded-lg border border-line bg-card px-2 text-xs font-bold outline-none focus:border-moss"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button className="h-[30px] rounded-lg border border-line bg-card px-2 text-xs font-bold hover:bg-line-soft">Apply</button>
    </form>
  );
}
