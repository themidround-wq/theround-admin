import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { adminFetch, currentAdmin, isOwner } from "@/lib/api";
import type { Admin } from "@/lib/types";
import { AddMember, TeamTable } from "./team-ui";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const [team, me] = await Promise.all([adminFetch<Admin[]>("/team"), currentAdmin()]);
  const owner = isOwner(me);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Team"
        description="Who can sign in to this dashboard. Viewers can read everything; admins can also take actions; owners also manage the team."
        actions={owner ? <AddMember /> : undefined}
      />
      {!owner && (
        <p className="mb-3 rounded-xl border border-line bg-card px-4 py-3 text-sm text-muted">Only owners can add people or change roles.</p>
      )}
      <Card>
        <TeamTable team={team} meId={me.id} owner={owner} />
      </Card>
    </>
  );
}
