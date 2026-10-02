import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Admin } from "./types";

/** httpOnly cookie holding the admin bearer token. */
export const SESSION_COOKIE = "tr_admin";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** theround-service base URL, including the /api prefix (same var as the landing page). */
export function apiUrl(path: string) {
  const base = process.env.THEROUND_API_URL;
  if (!base) throw new Error("Missing THEROUND_API_URL environment variable.");
  return `${base.replace(/\/+$/, "")}${path}`;
}

type Query = Record<string, string | number | undefined | null>;

/** The service logs who did what from where, so pass the browser's details through. */
async function clientHeaders() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
  const out: Record<string, string> = {};
  if (ip) out["x-admin-client-ip"] = ip;
  const ua = h.get("user-agent");
  if (ua) out["x-admin-user-agent"] = ua;
  return out;
}

async function messageOf(res: Response) {
  const body = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
  const m = body?.message;
  return (Array.isArray(m) ? m.join(". ") : m) || `Request failed (${res.status})`;
}

/**
 * Authenticated call to /api/admin. A 401 means the session ended (logout
 * elsewhere, expiry, or an owner removed access), so send them to sign in.
 */
export async function adminFetch<T = unknown>(
  path: string,
  opts: { method?: string; body?: unknown; query?: Query; raw?: boolean } = {},
): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const url = new URL(apiUrl(`/admin${path}`));
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(await clientHeaders()),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });

  if (res.status === 401) redirect("/login?expired=1");
  if (!res.ok) throw new ApiError(res.status, await messageOf(res));
  if (opts.raw) return res as T;
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Unauthenticated login call. */
export async function loginRequest(email: string, password: string) {
  const res = await fetch(apiUrl("/admin/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await clientHeaders()) },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new ApiError(res.status, await messageOf(res));
  return (await res.json()) as
    | { twoFactorRequired: true; challengeToken: string }
    | { twoFactorRequired: false; accessToken: string; expiresAt: string; admin: Admin };
}

/** The signed-in admin, fetched once per request. */
export const currentAdmin = cache(() => adminFetch<Admin>("/auth/me"));

export const canEdit = (a: Admin) => a.role !== "viewer";
export const isOwner = (a: Admin) => a.role === "owner";
