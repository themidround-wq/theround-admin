import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon, ChevronIcon } from "./icons";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{eyebrow}</div>}
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ className, children, ...rest }: ComponentProps<"section">) {
  return (
    <section className={cx("rounded-2xl border border-line bg-card", className)} {...rest}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
      <div>
        <h2 className="text-[15px] font-bold">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

/** A headline number with optional week-over-week delta. */
export function Stat({
  label,
  value,
  sub,
  change,
  tone = "light",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  change?: number | null;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className={cx("rounded-2xl border p-5", dark ? "border-night bg-night text-cream" : "border-line bg-card")}>
      <div className={cx("text-[11px] font-bold uppercase tracking-[0.12em]", dark ? "text-cream/55" : "text-muted")}>{label}</div>
      <div className="num mt-2 text-[30px] font-bold leading-none tracking-tight">{value}</div>
      <div className={cx("mt-2 flex items-center gap-1.5 text-xs", dark ? "text-cream/60" : "text-muted")}>
        {change != null && (
          <span
            className={cx(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold",
              change >= 0
                ? dark ? "bg-lime/15 text-lime" : "bg-[#e6f2dc] text-[#2f5f1a]"
                : dark ? "bg-white/10 text-cream" : "bg-danger-soft text-danger",
            )}
          >
            {change >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
            {Math.abs(change)}%
          </span>
        )}
        {sub}
      </div>
    </div>
  );
}

const badgeTones = {
  neutral: "bg-line-soft text-slate",
  green: "bg-[#e6f2dc] text-[#2f5f1a]",
  lime: "bg-lime text-ink",
  dark: "bg-ink text-cream",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", badgeTones[tone])}>
      {children}
    </span>
  );
}

const buttonVariants = {
  primary: "bg-ink text-cream hover:bg-night",
  secondary: "border border-line bg-card text-ink hover:bg-line-soft",
  ghost: "text-ink hover:bg-line-soft",
  danger: "bg-danger text-white hover:bg-[#962817]",
  "danger-ghost": "text-danger hover:bg-danger-soft",
};

export const buttonClass = (variant: keyof typeof buttonVariants = "secondary", size: "sm" | "md" = "md") =>
  cx(
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-bold transition-colors disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3.5 text-[13px]",
    buttonVariants[variant],
  );

export function Button({
  variant,
  size,
  className,
  ...rest
}: ComponentProps<"button"> & { variant?: keyof typeof buttonVariants; size?: "sm" | "md" }) {
  return <button className={cx(buttonClass(variant, size), className)} {...rest} />;
}

export const inputClass =
  "h-9 w-full rounded-lg border border-line bg-card px-3 text-sm outline-none placeholder:text-muted/70 focus:border-moss focus:ring-2 focus:ring-moss/15";

/** Data table shell: horizontal scroll on narrow screens. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">{children}</table>
    </div>
  );
}

export const th = "whitespace-nowrap px-4 pb-2.5 pt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-muted";
export const td = "border-t border-line-soft px-4 py-3 align-middle";

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-bold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{children}</p>}
    </div>
  );
}

/** Builds a URL that keeps the current filters and changes one or more. */
export function withParams(base: string, current: Record<string, string | string[] | undefined>, changes: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) if (typeof v === "string" && v) p.set(k, v);
  for (const [k, v] of Object.entries(changes)) {
    if (v === undefined || v === "") p.delete(k);
    else p.set(k, String(v));
  }
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}

export function Pagination({
  base,
  params,
  page,
  limit,
  total,
}: {
  base: string;
  params: Record<string, string | string[] | undefined>;
  page: number;
  limit: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(total, page * limit);
  return (
    <div className="flex items-center justify-between border-t border-line-soft px-4 py-3 text-xs text-muted">
      <span className="num">
        {from}–{to} of {total.toLocaleString("en-GB")}
      </span>
      <div className="flex items-center gap-1">
        <Link
          aria-disabled={page <= 1}
          href={withParams(base, params, { page: page - 1 > 1 ? page - 1 : undefined })}
          className={cx(buttonClass("secondary", "sm"), page <= 1 && "pointer-events-none opacity-40")}
        >
          <ChevronIcon className="h-3.5 w-3.5 rotate-180" /> Prev
        </Link>
        <span className="num px-2">
          {page} / {pages}
        </span>
        <Link
          aria-disabled={page >= pages}
          href={withParams(base, params, { page: page + 1 })}
          className={cx(buttonClass("secondary", "sm"), page >= pages && "pointer-events-none opacity-40")}
        >
          Next <ChevronIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/** Segmented links (e.g. status filter, date range). */
export function Segmented({
  options,
  value,
  hrefFor,
}: {
  options: { value: string; label: string }[];
  value: string;
  hrefFor: (v: string) => string;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-card p-0.5">
      {options.map((o) => (
        <Link
          key={o.value}
          href={hrefFor(o.value)}
          scroll={false}
          className={cx(
            "rounded-md px-2.5 py-1 text-xs font-bold transition-colors",
            o.value === value ? "bg-ink text-cream" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

export const num = (v: string | string[] | undefined, fallback: number) => {
  const n = Number(typeof v === "string" ? v : NaN);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
