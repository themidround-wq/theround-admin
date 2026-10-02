import { cx } from "./ui";

/**
 * Single-series column chart: moss columns, today's in ink, a recessive grid,
 * and a tooltip per column on hover/focus. A hidden table carries the values
 * for screen readers.
 */
export function ColumnChart({
  data,
  unit,
  height = 200,
}: {
  data: { label: string; short: string; value: number; highlight?: boolean }[];
  unit: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = niceCeil(max);
  const gap = data.length > 40 ? 1 : 2;
  // Label roughly every 7th column so dates never collide.
  const every = data.length <= 14 ? 1 : data.length <= 31 ? 5 : 14;

  return (
    <figure className="w-full">
      <div className="relative" style={{ height }}>
        {[1, 0.5, 0].map((f) => (
          <div key={f} className="absolute inset-x-0 flex items-center gap-2" style={{ top: `${(1 - f) * 100}%` }}>
            <span className="num w-7 -translate-y-1/2 text-right text-[10px] text-muted">{Math.round(top * f)}</span>
            <span className={cx("h-px flex-1 -translate-y-1/2", f === 0 ? "bg-line" : "bg-line-soft")} />
          </div>
        ))}
        <div className="absolute inset-y-0 left-9 right-0 flex items-end" style={{ gap }}>
          {data.map((d) => (
            <div key={d.label} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
              <div
                className={cx(
                  "w-full rounded-t-[4px] transition-opacity group-hover:opacity-80",
                  d.highlight ? "bg-ink" : "bg-moss",
                )}
                style={{ height: `${(d.value / top) * 100}%`, minHeight: d.value ? 2 : 0 }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-cream shadow-lg group-hover:block group-focus:block">
                <div className="text-cream/60">{d.label}</div>
                <div className="num font-bold">
                  {d.value.toLocaleString("en-GB")} {unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="ml-9 mt-2 flex" style={{ gap }}>
        {data.map((d, i) => (
          // Labels are wider than a column, so let them overflow centred on it.
          <span key={d.label} className="relative h-3 flex-1">
            {(data.length - 1 - i) % every === 0 && (
              <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-muted">{d.short}</span>
            )}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th>{d.label}</th>
              <td>
                {d.value} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Horizontal bars for a ranked or ordered breakdown. Values sit beside the bar in text ink. */
export function BarList({
  items,
  max,
  suffix,
}: {
  items: { label: string; value: number; note?: string; muted?: boolean }[];
  max?: number;
  suffix?: (v: number) => string;
}) {
  const top = Math.max(1, max ?? Math.max(...items.map((i) => i.value)));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className={cx("truncate", i.muted && "text-muted")}>{i.label}</span>
            <span className="num shrink-0 font-bold">
              {suffix ? suffix(i.value) : i.value.toLocaleString("en-GB")}
              {i.note && <span className="ml-1.5 font-normal text-muted">{i.note}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-line-soft">
            <div
              className={cx("h-full rounded-full", i.muted ? "bg-slate/40" : "bg-moss")}
              style={{ width: `${Math.max(i.value ? 1.5 : 0, (i.value / top) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Round a max up to 1, 2, 2.5 or 5 × 10^n so gridline labels are tidy. */
function niceCeil(n: number) {
  const p = 10 ** Math.floor(Math.log10(n));
  for (const m of [1, 2, 2.5, 5, 10]) if (n <= m * p) return m * p;
  return 10 * p;
}

/** "2026-09-30" → label pair for the column chart. */
export function dayLabels(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  return {
    label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
    short: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
  };
}
