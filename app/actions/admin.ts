"use server";

import { refresh } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ApiError, adminFetch } from "@/lib/api";
import QRCode from "qrcode";
import type { ActionResult, CatalogCategory } from "@/lib/types";

/**
 * Runs an admin API call, refreshes the page's data and reports back.
 * API errors become a message for the toast; redirects (expired session)
 * still propagate.
 */
async function run(fn: () => Promise<string>): Promise<ActionResult> {
  let message: string;
  try {
    message = await fn();
  } catch (e) {
    unstable_rethrow(e);
    if (e instanceof ApiError) return { ok: false, message: e.message };
    console.error("admin action failed", e);
    return { ok: false, message: "Couldn't reach the round API. Try again." };
  }
  refresh();
  return { ok: true, message };
}

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

// ---- waitlist ------------------------------------------------------------------

export async function addToWaitlist(_: ActionResult, f: FormData) {
  const emails = [...new Set(s(f, "emails").toLowerCase().split(/[\s,;]+/).filter(Boolean))];
  const bad = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (!emails.length) return { ok: false, message: "Paste at least one email." };
  if (bad.length) return { ok: false, message: `Not valid: ${bad.slice(0, 3).join(", ")}${bad.length > 3 ? "…" : ""}` };
  if (emails.length > 500) return { ok: false, message: "Add up to 500 at a time." };
  return run(async () => {
    const r = await adminFetch<{ added: number; skipped: number }>("/waitlist", { method: "POST", body: { emails } });
    return `Added ${plural(r.added, "email")}${r.skipped ? `, ${r.skipped} already on the list` : ""}.`;
  });
}

export async function inviteFromWaitlist(_: ActionResult, f: FormData) {
  const ids = s(f, "ids").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!ids.length) return { ok: false, message: "Select who to invite first." };
  let result: ActionResult = null;
  const r = await run(async () => {
    const x = await adminFetch<{ sent: number; skipped: number; failed: number; emailDisabled: boolean }>("/waitlist/invite", {
      method: "POST",
      body: { ids },
    });
    if (x.emailDisabled) {
      result = { ok: false, message: "Email isn't configured on the API (RESEND_API_KEY), so no invites went out." };
    } else if (x.failed) {
      result = { ok: false, message: `Sent ${x.sent}, ${x.failed} failed. Check the API logs.` };
    }
    return `Invited ${plural(x.sent, "person")}${x.skipped ? ` (${x.skipped} already have accounts)` : ""}.`;
  });
  return result ?? r;
}

export async function removeFromWaitlist(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/waitlist/${Number(s(f, "id"))}`, { method: "DELETE" });
    return "Removed from the waitlist.";
  });
}

// ---- users ---------------------------------------------------------------------

export async function setUserSuspended(_: ActionResult, f: FormData) {
  const suspended = s(f, "suspended") === "true";
  return run(async () => {
    await adminFetch(`/users/${s(f, "id")}`, { method: "PATCH", body: { suspended } });
    return suspended ? "User suspended. They're signed out of the app." : "User restored.";
  });
}

export async function deleteUser(_: ActionResult, f: FormData) {
  const r = await run(async () => {
    await adminFetch(`/users/${s(f, "id")}`, { method: "DELETE" });
    return "User deleted.";
  });
  if (r?.ok) redirect("/users?deleted=1");
  return r;
}

// ---- rounds --------------------------------------------------------------------

export async function deleteRound(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/rounds/${s(f, "id")}`, { method: "DELETE" });
    return "Round and its recording deleted.";
  });
}

/** Called from the play button; returns a short-lived signed URL. */
export async function roundAudioUrl(id: string): Promise<{ url?: string; error?: string }> {
  try {
    const r = await adminFetch<{ url: string }>(`/rounds/${id}/audio`);
    return { url: r.url };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof ApiError ? e.message : "Couldn't load the recording." };
  }
}

// ---- catalog -------------------------------------------------------------------

export async function createCategory(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch("/catalog/categories", { method: "POST", body: { name: s(f, "name") } });
    return "Category added. Add a topic and question to put it on the wheel.";
  });
}

export async function updateCategory(_: ActionResult, f: FormData) {
  const body: { name?: string; active?: boolean } = {};
  if (f.has("name")) body.name = s(f, "name");
  if (f.has("active")) body.active = s(f, "active") === "true";
  return run(async () => {
    await adminFetch(`/catalog/categories/${s(f, "id")}`, { method: "PATCH", body });
    return body.active === undefined ? "Category renamed." : body.active ? "Category is back on the wheel." : "Category hidden from the wheel.";
  });
}

export async function moveCategory(_: ActionResult, f: FormData) {
  const id = s(f, "id");
  const dir = s(f, "dir") === "up" ? -1 : 1;
  return run(async () => {
    const ids = (await adminFetch<CatalogCategory[]>("/catalog")).map((c) => c.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return "Already there.";
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await adminFetch("/catalog/categories/order", { method: "PUT", body: { ids } });
    return "Wheel order updated.";
  });
}

export async function deleteCategory(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/catalog/categories/${s(f, "id")}`, { method: "DELETE" });
    return "Category deleted.";
  });
}

export async function createTopic(_: ActionResult, f: FormData) {
  return run(async () => {
    const topic = await adminFetch<{ id: string }>("/catalog/topics", {
      method: "POST",
      body: { categoryId: s(f, "categoryId"), name: s(f, "name") },
    });
    // A topic is only spun once it has a question, so take one up front.
    const question = s(f, "question");
    if (question) {
      await adminFetch("/catalog/questions", { method: "POST", body: { topicId: topic.id, text: question } });
    }
    return question ? "Topic added." : "Topic added. Give it a question so it can be spun.";
  });
}

export async function updateTopic(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/catalog/topics/${s(f, "id")}`, { method: "PATCH", body: { name: s(f, "name") } });
    return "Topic renamed.";
  });
}

export async function deleteTopic(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/catalog/topics/${s(f, "id")}`, { method: "DELETE" });
    return "Topic deleted.";
  });
}

export async function createQuestion(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch("/catalog/questions", { method: "POST", body: { topicId: s(f, "topicId"), text: s(f, "text") } });
    return "Question added.";
  });
}

export async function updateQuestion(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/catalog/questions/${s(f, "id")}`, { method: "PATCH", body: { text: s(f, "text") } });
    return "Question updated.";
  });
}

export async function deleteQuestion(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/catalog/questions/${s(f, "id")}`, { method: "DELETE" });
    return "Question deleted.";
  });
}

// ---- settings ------------------------------------------------------------------

export async function updateSetting(_: ActionResult, f: FormData) {
  const key = s(f, "key");
  const raw = s(f, "value");
  const value = raw === "true" ? true : raw === "false" ? false : Number(raw);
  return run(async () => {
    await adminFetch("/settings", { method: "PATCH", body: { values: { [key]: value } } });
    return "Saved. Live on the API within 30 seconds.";
  });
}

// ---- own account ---------------------------------------------------------------

export async function updateProfile(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch("/auth/me", { method: "PATCH", body: { name: s(f, "name") } });
    return "Name updated.";
  });
}

export async function changePassword(_: ActionResult, f: FormData) {
  const next = String(f.get("newPassword") ?? "");
  if (next !== String(f.get("confirmPassword") ?? "")) return { ok: false, message: "The new passwords don't match." };
  if (next.length < 10) return { ok: false, message: "Use at least 10 characters." };
  return run(async () => {
    await adminFetch("/auth/password", {
      method: "POST",
      body: { currentPassword: String(f.get("currentPassword") ?? ""), newPassword: next },
    });
    return "Password changed. Other sessions were signed out.";
  });
}

export async function revokeSession(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/auth/sessions/${s(f, "id")}`, { method: "DELETE" });
    return "Session signed out.";
  });
}

export async function revokeOtherSessions() {
  return run(async () => {
    await adminFetch("/auth/sessions", { method: "DELETE" });
    return "Signed out everywhere else.";
  });
}

// ---- team ----------------------------------------------------------------------

export async function createTeamMember(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch("/team", {
      method: "POST",
      body: { email: s(f, "email"), name: s(f, "name"), role: s(f, "role"), password: String(f.get("password") ?? "") },
    });
    return `Added ${s(f, "email")}. Share their temporary password privately.`;
  });
}

export async function updateTeamMember(_: ActionResult, f: FormData) {
  const body: { role?: string; active?: boolean; password?: string; resetTwoFactor?: boolean } = {};
  if (f.has("resetTwoFactor")) body.resetTwoFactor = true;
  if (f.has("role")) body.role = s(f, "role");
  if (f.has("active")) body.active = s(f, "active") === "true";
  if (f.has("password")) body.password = String(f.get("password") ?? "");
  return run(async () => {
    await adminFetch(`/team/${s(f, "id")}`, { method: "PATCH", body });
    if (body.resetTwoFactor) return "Two-factor turned off for them. They can set it up again after signing in.";
    if (body.password) return "Password reset. They've been signed out everywhere.";
    if (body.active !== undefined) return body.active ? "Access restored." : "Access removed. They've been signed out.";
    return "Role updated.";
  });
}

export async function deleteTeamMember(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch(`/team/${s(f, "id")}`, { method: "DELETE" });
    return "Removed from the team.";
  });
}

// ---- two-factor ----------------------------------------------------------------

type CodesResult = { ok: true; recoveryCodes: string[] } | { ok: false; message: string };

const asError = (e: unknown): { ok: false; message: string } => {
  unstable_rethrow(e);
  if (e instanceof ApiError) return { ok: false, message: e.message };
  console.error("2fa action failed", e);
  return { ok: false, message: "Couldn't reach the round API. Try again." };
};

/** New secret plus a QR code (SVG, rendered here so the secret never hits a third party). */
export async function startTwoFactorSetup(): Promise<{ ok: true; secret: string; qrSvg: string } | { ok: false; message: string }> {
  try {
    const r = await adminFetch<{ secret: string; otpauthUri: string }>("/auth/2fa/setup", { method: "POST" });
    const qrSvg = await QRCode.toString(r.otpauthUri, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#14271a", light: "#ffffff" } });
    return { ok: true, secret: r.secret, qrSvg };
  } catch (e) {
    return asError(e);
  }
}

export async function confirmTwoFactor(code: string): Promise<CodesResult> {
  try {
    const r = await adminFetch<{ recoveryCodes: string[] }>("/auth/2fa/enable", { method: "POST", body: { code } });
    return { ok: true, recoveryCodes: r.recoveryCodes };
  } catch (e) {
    return asError(e);
  }
}

export async function newRecoveryCodes(code: string): Promise<CodesResult> {
  try {
    const r = await adminFetch<{ recoveryCodes: string[] }>("/auth/2fa/recovery-codes", { method: "POST", body: { code } });
    return { ok: true, recoveryCodes: r.recoveryCodes };
  } catch (e) {
    return asError(e);
  }
}

export async function disableTwoFactor(_: ActionResult, f: FormData) {
  return run(async () => {
    await adminFetch("/auth/2fa/disable", {
      method: "POST",
      body: { password: String(f.get("password") ?? ""), code: s(f, "code") },
    });
    return "Two-factor is off. Your account is protected by your password only.";
  });
}

/** Re-renders the page after setup finishes (the codes dialog is closed). */
export async function refreshPage() {
  refresh();
}
