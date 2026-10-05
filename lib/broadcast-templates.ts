import type { Audience, BroadcastKind } from "./types";

export const KIND_INFO: Record<BroadcastKind, { label: string; emailLabel: string; description: string }> = {
  newsletter: {
    label: "Newsletter",
    emailLabel: "Newsletter",
    description: "Regular round-up: what's new, a practice tip, a student story.",
  },
  feature_update: {
    label: "Feature update",
    emailLabel: "New in The Round",
    description: "Announce something you shipped and how to use it.",
  },
  announcement: {
    label: "Announcement",
    emailLabel: "Announcement",
    description: "Launches, events, partnerships, big news.",
  },
  maintenance: {
    label: "Maintenance notice",
    emailLabel: "Service notice",
    description: "Planned downtime or an incident. Reaches app users even if they unsubscribed from newsletters.",
  },
};

/** Starter content for each scenario. `{{name}}` becomes the reader's first name. */
export const TEMPLATES: Record<
  BroadcastKind,
  { subject: string; preheader: string; headline: string; bodyHtml: string; ctaLabel: string | null; ctaUrl: string | null; audience: Audience }
> = {
  newsletter: {
    subject: "This month on The Round",
    preheader: "New topics, a practice tip, and what we're working on.",
    headline: "This month on The Round",
    audience: "users_all",
    ctaLabel: "Spin a round",
    ctaUrl: "https://theround.app",
    bodyHtml: `<p>Hi {{name}},</p>
<p>Here's what's been happening, and one small habit worth trying this week.</p>
<h2>What's new</h2>
<ul><li><p>New topic:</p></li><li><p>Improvement:</p></li></ul>
<h2>Practice tip</h2>
<p>Before you answer, say your structure out loud in one sentence: "I'll cover assessment, escalation, then documentation." It buys you thinking time and keeps you on track.</p>
<blockquote><p>A quote or story from a student.</p></blockquote>
<p>Keep going. A few minutes a day adds up.</p>`,
  },
  feature_update: {
    subject: "New: [feature name]",
    preheader: "A quicker way to practise what matters.",
    headline: "Say hello to [feature name]",
    audience: "users_all",
    ctaLabel: "Try it now",
    ctaUrl: "https://theround.app",
    bodyHtml: `<p>Hi {{name}},</p>
<p>You asked for it, so we built it. <strong>[Feature name]</strong> is live in The Round today.</p>
<h2>What it does</h2>
<p>One or two sentences on the problem it solves for students.</p>
<h2>How to use it</h2>
<ol><li><p>Open The Round and …</p></li><li><p>Tap …</p></li><li><p>…</p></li></ol>
<p>Tell us what you think by replying to this email. We read every reply.</p>`,
  },
  announcement: {
    subject: "Big news from The Round",
    preheader: "Something we've been waiting to tell you.",
    headline: "Big news",
    audience: "everyone",
    ctaLabel: null,
    ctaUrl: null,
    bodyHtml: `<p>Hi {{name}},</p>
<p>We've got something to share.</p>
<p>What's happening, why it matters to student midwives, and what changes for you (if anything).</p>
<p>Thank you for being part of The Round from the start.</p>`,
  },
  maintenance: {
    subject: "Scheduled maintenance on [date]",
    preheader: "The Round will be briefly unavailable.",
    headline: "Scheduled maintenance",
    audience: "users_all",
    ctaLabel: null,
    ctaUrl: null,
    bodyHtml: `<p>Hi {{name}},</p>
<p>We're doing some planned maintenance to keep The Round fast and reliable.</p>
<ul><li><p><strong>When:</strong> [day, date], [start]–[end] WAT</p></li><li><p><strong>What's affected:</strong> you won't be able to spin or save rounds during this window.</p></li><li><p><strong>Your data:</strong> saved rounds and recordings are safe.</p></li></ul>
<p>Sorry for the interruption. If anything looks wrong afterwards, just reply to this email.</p>`,
  },
};
