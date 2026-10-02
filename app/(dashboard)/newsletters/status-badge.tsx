import { Badge } from "@/components/ui";
import type { BroadcastStatus } from "@/lib/types";

const TONE = { draft: "neutral", scheduled: "warn", sending: "lime", sent: "green", cancelled: "danger" } as const;
const LABEL = { draft: "Draft", scheduled: "Scheduled", sending: "Sending…", sent: "Sent", cancelled: "Stopped" };

export function StatusBadge({ status }: { status: BroadcastStatus }) {
  return <Badge tone={TONE[status]}>{LABEL[status]}</Badge>;
}
