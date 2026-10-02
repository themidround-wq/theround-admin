// Response shapes of theround-service /api/admin endpoints.

export type Role = "viewer" | "admin" | "owner";

export type Admin = {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  twoFactorEnabled: boolean;
};

export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type WaitlistStatus = "pending" | "invited" | "joined";

export type WaitlistEntry = {
  id: number;
  ticketNumber: number;
  email: string;
  createdAt: string;
  invitedAt: string | null;
  userId: string | null;
  status: WaitlistStatus;
};

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  pictureUrl: string | null;
  avatarId: number | null;
  stage: "student" | "qualified" | null;
  course: string | null;
  year: string | null;
  semester: string | null;
  goal: "build_confidence" | "prepare_for_exams" | null;
  defaultResponseSeconds: number;
  soundCues: boolean;
  onboarded: boolean;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserRow = AppUser & { roundsSaved: number; lastRoundAt: string | null };

export type UserStats = {
  totalRounds: number;
  roundsThisWeek: number;
  speakingSeconds: number;
  mostPractised: { category: string; rounds: number } | null;
  currentStreakDays: number;
};

export type RoundStatus = "spun" | "in_progress" | "completed" | "saved";
export type Reflection = "clear" | "a_little_unsure" | "lost_my_structure" | "want_another_go";

export type Round = {
  id: string;
  status: RoundStatus;
  category: { id: string; name: string };
  topic: { id: string; name: string };
  question: { id: string; text: string };
  durationSeconds: number;
  responseType: "quick" | "case";
  spokenSeconds: number | null;
  hasAudio: boolean;
  reflection: Reflection | null;
  note: string | null;
  bookmarked: boolean;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  savedAt: string | null;
  user: { id: string; email: string; name: string | null };
};

export type UserDetail = {
  user: AppUser;
  stats: UserStats;
  rounds: Paged<Round>;
  waitlist: { ticketNumber: number; joinedAt: string } | null;
};

export type Overview = {
  kpis: {
    waitlistTotal: number;
    waitlistToday: number;
    waitlistThisWeek: number;
    waitlistLastWeek: number;
    waitlistConverted: number;
    usersTotal: number;
    usersThisWeek: number;
    usersLastWeek: number;
    onboarded: number;
    suspended: number;
    roundsSaved: number;
    roundsThisWeek: number;
    roundsLastWeek: number;
    speakingSeconds: number;
    activeUsers7d: number;
  };
  series: { date: string; waitlist: number; users: number; rounds: number }[];
  recentWaitlist: WaitlistEntry[];
  recentUsers: UserRow[];
};

export type Activity = {
  funnel: { spun: number; started: number; completed: number; saved: number };
  reflections: Record<string, number>;
  length: { quick: number; case: number };
  avgSpokenSeconds: number;
  practisingUsers: number;
  categories: { id: string; name: string; rounds: number }[];
  series: { date: string; rounds: number; activeUsers: number }[];
};

export type CatalogCategory = {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  playable: boolean;
  rounds: number;
  topics: {
    id: string;
    name: string;
    rounds: number;
    questions: { id: string; text: string; rounds: number }[];
  }[];
};

export type Setting = {
  key: string;
  type: "boolean" | "number";
  options?: number[];
  default: boolean | number;
  label: string;
  description: string;
  value: boolean | number;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type Session = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
};

export type AuditEntry = {
  id: string;
  adminId: string | null;
  adminEmail: string;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

/** What every server action hands back to the form that called it. */
export type ActionResult = { ok: boolean; message: string } | null;

// ---- newsletters ---------------------------------------------------------------

export type BroadcastKind = "newsletter" | "feature_update" | "announcement" | "maintenance";
export type BroadcastStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";
export type Audience =
  | "users_all"
  | "users_onboarded"
  | "users_students"
  | "users_qualified"
  | "users_inactive"
  | "waitlist_pending"
  | "waitlist_all"
  | "everyone";

export type BroadcastContent = {
  kind: BroadcastKind;
  subject: string;
  preheader: string;
  headline: string;
  bodyHtml: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  audience: Audience;
};

export type Broadcast = BroadcastContent & {
  id: string;
  status: BroadcastStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  suppressedCount: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AudienceOption = {
  key: Audience;
  label: string;
  description: string;
  users: boolean;
  count: number;
  suppressed: number;
};

export type BroadcastRecipient = {
  id: string;
  email: string;
  name: string | null;
  status: "pending" | "sending" | "sent" | "failed";
  error: string | null;
  messageId: string | null;
  sentAt: string | null;
};

export type BroadcastSummary = {
  broadcastsSent30d: number;
  emailsSent30d: number;
  scheduled: number;
  drafts: number;
  unsubscribed: number;
};

export type Unsubscribe = { email: string; source: string; createdAt: string };
