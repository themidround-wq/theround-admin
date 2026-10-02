import type { Metadata } from "next";
import { PageHeader, Stat } from "@/components/ui";
import { adminFetch, canEdit, currentAdmin } from "@/lib/api";
import type { CatalogCategory } from "@/lib/types";
import { CatalogEditor } from "./catalog-editor";

export const metadata: Metadata = { title: "Clinical content" };

export default async function ContentPage() {
  const [catalog, admin] = await Promise.all([adminFetch<CatalogCategory[]>("/catalog"), currentAdmin()]);
  const onWheel = catalog.filter((c) => c.playable);
  const topics = catalog.flatMap((c) => c.topics);
  const questions = topics.flatMap((t) => t.questions);

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Clinical content"
        description="The wheel's categories, their topics and the questions students answer. A category spins only when it's visible and has at least one topic with a question."
      />
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat tone="dark" label="On the wheel" value={onWheel.length} sub={`of ${catalog.length} categories`} />
        <Stat label="Reviewed topics" value={onWheel.reduce((n, c) => n + c.topics.filter((t) => t.questions.length).length, 0)} sub="the app's topic counter" />
        <Stat label="Questions" value={questions.length} />
        <Stat label="Unanswered questions" value={questions.filter((q) => q.rounds === 0).length} sub="never saved by anyone" />
      </div>
      <CatalogEditor catalog={catalog} editable={canEdit(admin)} />
    </>
  );
}
