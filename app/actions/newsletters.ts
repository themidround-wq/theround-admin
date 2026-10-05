"use server";

import { refresh } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ApiError, adminFetch } from "@/lib/api";
import { TEMPLATES } from "@/lib/broadcast-templates";
import type { ActionResult, Broadcast, BroadcastContent, BroadcastKind } from "@/lib/types";

const fail = (e: unknown): { ok: false; message: string } => {
  unstable_rethrow(e);
  if (e instanceof ApiError) return { ok: false, message: e.message };
  console.error("newsletter action failed", e);
  return { ok: false, message: "Couldn't reach the round API. Try again." };
};

/** Starts a draft from a scenario template and opens the editor. */
export async function createFromTemplate(kind: BroadcastKind) {
  const t = TEMPLATES[kind];
  const b = await adminFetch<Broadcast>("/broadcasts", { method: "POST", body: { kind, ...t } });
  redirect(`/newsletters/${b.id}`);
}

/** Autosave from the editor. */
export async function saveBroadcast(id: string, content: Partial<BroadcastContent>) {
  try {
    const b = await adminFetch<Broadcast>(`/broadcasts/${id}`, { method: "PATCH", body: content });
    return { ok: true as const, updatedAt: b.updatedAt };
  } catch (e) {
    return fail(e);
  }
}

/** Renders unsaved content exactly as recipients will see it. */
export async function previewBroadcast(content: Omit<BroadcastContent, "audience">) {
  try {
    const r = await adminFetch<{ subject: string; html: string; text: string }>("/broadcasts/preview", {
      method: "POST",
      body: content,
    });
    return { ok: true as const, ...r };
  } catch (e) {
    return fail(e);
  }
}

export async function sendTest(id: string, to: string[]): Promise<ActionResult> {
  try {
    await adminFetch(`/broadcasts/${id}/test`, { method: "POST", body: to.length ? { to } : {} });
    return { ok: true, message: `Test sent to ${to.length ? to.join(", ") : "you"}.` };
  } catch (e) {
    return fail(e);
  }
}

export async function scheduleBroadcast(id: string, scheduledAt: string): Promise<ActionResult> {
  try {
    await adminFetch(`/broadcasts/${id}/schedule`, { method: "POST", body: { scheduledAt } });
  } catch (e) {
    return fail(e);
  }
  refresh();
  return { ok: true, message: "Scheduled. You can still edit it until it goes out." };
}

export async function sendBroadcastNow(id: string): Promise<ActionResult> {
  try {
    const b = await adminFetch<Broadcast>(`/broadcasts/${id}/send`, { method: "POST" });
    refresh();
    return { ok: true, message: `Sending to ${b.recipientCount.toLocaleString("en-GB")} people.` };
  } catch (e) {
    return fail(e);
  }
}

/** Form actions for the report and list views. */
export async function broadcastAction(_: ActionResult, f: FormData): Promise<ActionResult> {
  const id = String(f.get("id") ?? "");
  const op = String(f.get("op") ?? "");
  let message = "";
  let goTo: string | null = null;
  try {
    if (op === "cancel") {
      const b = await adminFetch<Broadcast>(`/broadcasts/${id}/cancel`, { method: "POST" });
      message = b.status === "draft" ? "Schedule cancelled. It's a draft again." : "Stopped. Nobody else will get it.";
    } else if (op === "retry") {
      const r = await adminFetch<{ retrying: number }>(`/broadcasts/${id}/retry`, { method: "POST" });
      message = `Retrying ${r.retrying} failed address${r.retrying === 1 ? "" : "es"}.`;
    } else if (op === "duplicate") {
      const b = await adminFetch<Broadcast>(`/broadcasts/${id}/duplicate`, { method: "POST" });
      goTo = `/newsletters/${b.id}`;
    } else if (op === "delete") {
      await adminFetch(`/broadcasts/${id}`, { method: "DELETE" });
      goTo = "/newsletters?deleted=1";
    } else {
      return { ok: false, message: "Unknown action." };
    }
  } catch (e) {
    return fail(e);
  }
  if (goTo) redirect(goTo);
  refresh();
  return { ok: true, message };
}

export async function addUnsubscribe(_: ActionResult, f: FormData): Promise<ActionResult> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  try {
    const r = await adminFetch<{ added: boolean }>("/unsubscribes", { method: "POST", body: { email } });
    refresh();
    return { ok: true, message: r.added ? `${email} won't get newsletters any more.` : `${email} was already unsubscribed.` };
  } catch (e) {
    return fail(e);
  }
}

export async function removeUnsubscribe(_: ActionResult, f: FormData): Promise<ActionResult> {
  const email = String(f.get("email") ?? "");
  try {
    await adminFetch(`/unsubscribes/${encodeURIComponent(email)}`, { method: "DELETE" });
    refresh();
    return { ok: true, message: `${email} is subscribed again.` };
  } catch (e) {
    return fail(e);
  }
}
