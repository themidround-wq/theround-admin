import Link from "next/link";
import { BarList, ColumnChart, dayLabels } from "@/components/charts";
import { ChevronIcon } from "@/components/icons";
import { Badge, Card, CardHeader, PageHeader, Segmented, Stat, Table, td, th, withParams } from "@/components/ui";
import { adminFetch } from "@/lib/api";
import { delta, fmtAgo, fmtDuration, fmtNumber, pct } from "@/lib/format";
import type { Overview } from "@/lib/types";

const RANGES = [
  { value: "7", label: "7d" },
  { value: "14", label: "14d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
];

const METRICS = {
  waitlist: { label: "Waitlist signups", short: "Waitlist", unit: "signups" },
  users: { label: "New accounts", short: "Accounts", unit: "accounts" },
  rounds: { label: "Saved rounds", short: "Rounds", unit: "rounds" },
} as const;
type Metric = keyof typeof METRICS;

export default async function OverviewPage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const days = ["7", "14", "30", "90"].includes(String(sp.days)) ? Number(sp.days) : 30;
  const metric: Metric = String(sp.metric) in METRICS ? (String(sp.metric) as Metric) : "waitlist";
  const data = await adminFetch<Overview>("/overview", { query: { days } });
  const k = data.kpis;

  const today = new Date().toISOString().slice(0, 10);
  const series = data.series.map((d) => ({ ...dayLabels(d.date), value: d[metric], highlight: d.date === today }));
  const windowTotal = series.reduce((n, d) => n + d.value, 0);

  return (
    <>
      <PageHeader
        eyebrow="Founder control room"
        title="Overview"
        description="Know it. Say it. Practice it. Here's how the round is growing."
        actions={<Segmented options={RANGES} value={String(days)} hrefFor={(v) => withParams("/", sp, { days: v === "30" ? undefined : v })} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          tone="dark"
          label="Waitlist"
          value={fmtNumber(k.waitlistTotal)}
          change={delta(k.waitlistThisWeek, k.waitlistLastWeek)}
          sub={`${k.waitlistThisWeek} this week · ${k.waitlistToday} today`}
        />
        <Stat
          label="Accounts"
          value={fmtNumber(k.usersTotal)}
          change={delta(k.usersThisWeek, k.usersLastWeek)}
          sub={`${pct(k.onboarded, k.usersTotal)}% onboarded`}
        />
        <Stat
          label="Saved rounds"
          value={fmtNumber(k.roundsSaved)}
          change={delta(k.roundsThisWeek, k.roundsLastWeek)}
          sub={`${k.roundsThisWeek} this week`}
        />
        <Stat label="Active this week" value={fmtNumber(k.activeUsers7d)} sub={`of ${fmtNumber(k.onboarded)} onboarded users`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title={METRICS[metric].label}
            description={`${fmtNumber(windowTotal)} in the last ${days} days · UTC days, today in dark`}
            actions={
              <Segmented
                options={Object.entries(METRICS).map(([value, m]) => ({ value, label: m.short }))}
                value={metric}
                hrefFor={(v) => withParams("/", sp, { metric: v === "waitlist" ? undefined : v })}
              />
            }
          />
          <div className="px-5 pb-5 pt-6">
            <ColumnChart data={series} unit={METRICS[metric].unit} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Waitlist → practice" description="How far people get, all time" />
          <div className="p-5">
            <BarList
              max={k.waitlistTotal}
              items={[
                { label: "On the waitlist", value: k.waitlistTotal },
                { label: "Created an account", value: k.waitlistConverted, note: `${pct(k.waitlistConverted, k.waitlistTotal)}%` },
                { label: "Finished onboarding", value: k.onboarded, note: `${pct(k.onboarded, k.waitlistTotal)}%` },
                { label: "Practised this week", value: k.activeUsers7d, note: `${pct(k.activeUsers7d, k.waitlistTotal)}%` },
              ]}
            />
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-canvas p-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Time spoken</div>
                <div className="num mt-1 text-lg font-bold">{fmtDuration(k.speakingSeconds)}</div>
              </div>
              <div className="rounded-xl bg-canvas p-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">Suspended</div>
                <div className="num mt-1 text-lg font-bold">{k.suspended}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Latest waitlist signups"
            actions={
              <Link href="/waitlist" className="flex items-center gap-1 text-xs font-bold text-moss hover:underline">
                All <ChevronIcon className="h-3 w-3" />
              </Link>
            }
          />
          <Table>
            <thead>
              <tr>
                <th className={th}>Ticket</th>
                <th className={th}>Email</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.recentWaitlist.map((w) => (
                <tr key={w.id}>
                  <td className={`${td} num font-bold`}>#{w.ticketNumber}</td>
                  <td className={`${td} max-w-[220px] truncate`}>{w.email}</td>
                  <td className={td}>
                    <Badge tone={w.status === "joined" ? "green" : w.status === "invited" ? "warn" : "neutral"}>{w.status}</Badge>
                  </td>
                  <td className={`${td} whitespace-nowrap text-right text-muted`}>{fmtAgo(w.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader
            title="Newest accounts"
            actions={
              <Link href="/users" className="flex items-center gap-1 text-xs font-bold text-moss hover:underline">
                All <ChevronIcon className="h-3 w-3" />
              </Link>
            }
          />
          <Table>
            <thead>
              <tr>
                <th className={th}>Name</th>
                <th className={th}>Course</th>
                <th className={`${th} text-right`}>Rounds</th>
                <th className={`${th} text-right`}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-canvas/60">
                  <td className={td}>
                    <Link href={`/users/${u.id}`} className="font-bold hover:underline">
                      {u.name ?? "—"}
                    </Link>
                    <div className="max-w-[200px] truncate text-xs text-muted">{u.email}</div>
                  </td>
                  <td className={td}>{u.course ?? <span className="text-muted">Onboarding</span>}</td>
                  <td className={`${td} num text-right`}>{u.roundsSaved}</td>
                  <td className={`${td} whitespace-nowrap text-right text-muted`}>{fmtAgo(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
