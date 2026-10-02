"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, SESSION_COOKIE, adminFetch, apiUrl, loginRequest } from "@/lib/api";
import type { ActionResult } from "@/lib/types";

/** Only same-site paths, so `?next=` can't bounce an admin to another origin. */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
};

const UNREACHABLE = "Can't reach the round API. Try again shortly.";

/**
 * Sign-in form state. After a correct password on an account with 2FA, the
 * form switches to the code step and carries the short-lived challenge.
 */
export type LoginState =
  | null
  | { step: "password"; error: string }
  | { step: "code"; challenge: string; error?: string };

async function setSession(token: string, expiresAt: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });
}

/** Browser IP and user agent, so the API can log and throttle correctly. */
async function clientHeaders() {
  const h = await headers();
  const out: Record<string, string> = { "Content-Type": "application/json" };
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
  if (ip) out["x-admin-client-ip"] = ip;
  const ua = h.get("user-agent");
  if (ua) out["x-admin-user-agent"] = ua;
  return out;
}

async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: await clientHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => null)) as { message?: string | string[] } | null;
    const m = j?.message;
    throw new ApiError(res.status, (Array.isArray(m) ? m.join(". ") : m) || `Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const next = safeNext(formData.get("next"));

  // Step two: the 6-digit code (or a recovery code).
  if (state?.step === "code" || formData.get("challenge")) {
    const challenge = String(formData.get("challenge") ?? "");
    const code = String(formData.get("code") ?? "").trim();
    if (!code) return { step: "code", challenge, error: "Enter the code from your authenticator app." };
    let session;
    try {
      session = await publicPost<{ accessToken: string; expiresAt: string }>("/admin/auth/login/2fa", {
        challengeToken: challenge,
        code,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && /password again/.test(e.message)) {
        return { step: "password", error: e.message };
      }
      if (e instanceof ApiError && (e.status === 401 || e.status === 429 || e.status === 400)) {
        return { step: "code", challenge, error: e.message };
      }
      console.error("admin 2fa failed", e);
      return { step: "code", challenge, error: UNREACHABLE };
    }
    await setSession(session.accessToken, session.expiresAt);
    redirect(next);
  }

  // Step one: email and password.
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { step: "password", error: "Enter your email and password." };

  let result;
  try {
    result = await loginRequest(email, password);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 429)) {
      return { step: "password", error: e.message };
    }
    console.error("admin login failed", e);
    return { step: "password", error: UNREACHABLE };
  }
  if (result.twoFactorRequired) return { step: "code", challenge: result.challengeToken };
  await setSession(result.accessToken, result.expiresAt);
  redirect(next);
}

export async function logout() {
  // Revoke server-side first; if the session is already gone that's fine.
  await adminFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?signedOut=1");
}

export async function forgotPassword(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email." };
  try {
    await publicPost("/admin/auth/forgot-password", { email });
  } catch (e) {
    console.error("forgot password failed", e);
    return { ok: false, message: UNREACHABLE };
  }
  // Same answer whether or not it's an admin account.
  return {
    ok: true,
    message: `If ${email} belongs to an admin, a reset link is on its way. It works once and expires in 30 minutes.`,
  };
}

export async function resetPassword(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) return { ok: false, message: "Use at least 10 characters." };
  if (password !== String(formData.get("confirm") ?? "")) return { ok: false, message: "The passwords don't match." };
  try {
    await publicPost("/admin/auth/reset-password", { token, password });
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) return { ok: false, message: e.message };
    console.error("reset password failed", e);
    return { ok: false, message: UNREACHABLE };
  }
  redirect("/login?reset=1");
}
