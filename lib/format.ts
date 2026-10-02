const TZ = "Africa/Lagos";

export const fmtNumber = (n: number) => n.toLocaleString("en-GB");

export const fmtDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ })
    : "—";

export const fmtDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: TZ,
      })
    : "—";

/** "3m ago", "2h ago", "5d ago", then a date. */
export function fmtAgo(iso: string | null | undefined) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 14) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
}

/** 34349 → "9h 32m"; 84 → "1m 24s". */
export function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h) return `${h}h ${m}m`;
  if (m) return s ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

/** Week-over-week change, or null when there's nothing to compare against. */
export function delta(now: number, before: number) {
  if (!before) return now ? null : 0;
  return Math.round(((now - before) / before) * 100);
}

export const REFLECTION_LABEL: Record<string, string> = {
  clear: "Clear",
  a_little_unsure: "A little unsure",
  lost_my_structure: "Lost my structure",
  want_another_go: "Want another go",
  none: "No reflection",
};

export const GOAL_LABEL: Record<string, string> = {
  build_confidence: "Build confidence",
  prepare_for_exams: "Prepare for exams",
};

export const STATUS_LABEL: Record<string, string> = {
  spun: "Spun",
  in_progress: "In progress",
  completed: "Completed",
  saved: "Saved",
};

/** Short, readable device label from a user-agent string. */
export function deviceOf(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /curl|node|undici/i.test(ua) ? "Script" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}
