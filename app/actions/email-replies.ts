"use server";

import { refresh } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { ApiError, adminFetch } from "@/lib/api";
import type { ActionResult, EmailReply, EmailReplyStatus } from "@/lib/types";

const fail = (e: unknown): { ok: false; message: string } => {
  unstable_rethrow(e);
  if (e instanceof ApiError) return { ok: false, message: e.message };
  console.error("email replies action failed", e);
  return { ok: false, message: "Couldn't reach the round API. Try again." };
};

export async function updateReplyStatus(
  id: string,
  status: EmailReplyStatus,
): Promise<ActionResult> {
  try {
    await adminFetch<EmailReply>(`/email-replies/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
    refresh();
    const label = status === "unread" ? "Marked as unread" : status === "read" ? "Marked as read" : "Archived";
    return { ok: true, message: label };
  } catch (e) {
    return fail(e);
  }
}

export async function sendReplyMessage(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const bodyText = String(formData.get("bodyText") ?? "").trim();

  if (!id) return { ok: false, message: "Missing reply ID" };
  if (!bodyText) return { ok: false, message: "Please type a message before sending." };

  try {
    await adminFetch(`/email-replies/${id}/reply`, {
      method: "POST",
      body: { bodyText },
    });
    refresh();
    return { ok: true, message: "Reply sent successfully!" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteReplyAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing reply ID" };

  try {
    await adminFetch(`/email-replies/${id}`, { method: "DELETE" });
  } catch (e) {
    return fail(e);
  }
  redirect("/email-replies");
}

export async function createTestInboundReply(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const from = String(formData.get("from") ?? "").trim();
  const fromName = String(formData.get("fromName") ?? "").trim() || undefined;
  const subject = String(formData.get("subject") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();

  if (!from || !subject || !text) {
    return { ok: false, message: "Please provide sender email, subject, and message text." };
  }

  try {
    await adminFetch("/email-replies/test-inbound", {
      method: "POST",
      body: { from, fromName, subject, text },
    });
    refresh();
    return { ok: true, message: "Simulated inbound email created!" };
  } catch (e) {
    return fail(e);
  }
}
