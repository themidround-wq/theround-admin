"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, SESSION_COOKIE, adminFetch, loginRequest } from "@/lib/api";
import type { ActionResult } from "@/lib/types";

/** Only same-site paths, so `?next=` can't bounce an admin to another origin. */
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
};

export async function login(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Enter your email and password." };

  let session;
  try {
    session = await loginRequest(email, password);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 429)) {
      return { ok: false, message: e.message };
    }
    console.error("admin login failed", e);
    return { ok: false, message: "Can't reach the round API. Try again shortly." };
  }

  (await cookies()).set(SESSION_COOKIE, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  // Revoke server-side first; if the session is already gone that's fine.
  await adminFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login?signedOut=1");
}
