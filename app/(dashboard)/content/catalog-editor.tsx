"use client";

import { useState, type ReactNode } from "react";
import {
  createCategory,
  createQuestion,
  createTopic,
  deleteCategory,
  deleteQuestion,
  deleteTopic,
  moveCategory,
  updateCategory,
  updateQuestion,
  updateTopic,
} from "@/app/actions/admin";
import { ActionForm, ConfirmSubmit } from "@/components/action-form";
import { ArrowDownIcon, ArrowUpIcon, ChevronIcon, EyeOffIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { Badge, Button, Card, cx, inputClass } from "@/components/ui";
import type { CatalogCategory } from "@/lib/types";

type Action = Parameters<typeof ActionForm>[0]["action"];

export function CatalogEditor({ catalog, editable }: { catalog: CatalogCategory[]; editable: boolean }) {
  const [open, setOpen] = useState<string | null>(catalog[0]?.id ?? null);

  return (
    <div className="space-y-2">
      {catalog.map((c, i) => (
        <Card key={c.id} className={cx(!c.active && "bg-card/60")}>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            {editable && (
              <div className="flex flex-col">
                <MoveButton id={c.id} dir="up" disabled={i === 0} />
                <MoveButton id={c.id} dir="down" disabled={i === catalog.length - 1} />
              </div>
            )}
            <button
              onClick={() => setOpen(open === c.id ? null : c.id)}
              aria-expanded={open === c.id}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <ChevronIcon className={cx("h-4 w-4 shrink-0 text-muted transition-transform", open === c.id && "rotate-90")} />
              <span className="num w-5 shrink-0 text-xs font-bold text-muted">{i + 1}</span>
              <span className={cx("truncate font-bold", !c.active && "text-muted")}>{c.name}</span>
            </button>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              {!c.active ? <Badge>Hidden</Badge> : !c.playable ? <Badge tone="warn">Needs a question</Badge> : <Badge tone="green">On the wheel</Badge>}
              <span className="num">
                {c.topics.length} topics · {c.rounds} saved rounds
              </span>
            </div>
          </div>

          {open === c.id && (
            <div className="border-t border-line-soft px-4 pb-4 pt-3">
              {editable && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <InlineEdit action={updateCategory} id={c.id} name="name" value={c.name} label="Rename category" />
                  <ActionForm action={updateCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="active" value={String(!c.active)} />
                    <SubmitButton size="sm" variant="secondary">
                      <EyeOffIcon className="h-3.5 w-3.5" /> {c.active ? "Hide from wheel" : "Show on wheel"}
                    </SubmitButton>
                  </ActionForm>
                  {c.rounds === 0 && (
                    <ActionForm action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmSubmit prompt="Delete category and its topics?" confirmLabel="Delete">
                        <TrashIcon className="h-3.5 w-3.5" /> Delete
                      </ConfirmSubmit>
                    </ActionForm>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {c.topics.map((t) => (
                  <div key={t.id} className="rounded-xl border border-line-soft bg-canvas/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{t.name}</span>
                        {t.questions.length === 0 && <Badge tone="warn">No questions</Badge>}
                        <span className="num text-xs text-muted">{t.rounds} saved</span>
                      </div>
                      {editable && (
                        <div className="flex items-center gap-1">
                          <InlineEdit action={updateTopic} id={t.id} name="name" value={t.name} label="Rename" />
                          {t.rounds === 0 && (
                            <ActionForm action={deleteTopic}>
                              <input type="hidden" name="id" value={t.id} />
                              <ConfirmSubmit prompt="Delete topic?" confirmLabel="Delete">
                                <TrashIcon className="h-3.5 w-3.5" />
                                <span className="sr-only">Delete {t.name}</span>
                              </ConfirmSubmit>
                            </ActionForm>
                          )}
                        </div>
                      )}
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {t.questions.map((q) => (
                        <li key={q.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-card px-3 py-2 text-[13px]">
                          <QuestionText q={q} editable={editable} />
                        </li>
                      ))}
                    </ul>
                    {editable && (
                      <AddInline label="Add question">
                        {(close) => (
                          <ActionForm action={createQuestion} onSuccess={close} className="mt-2 flex flex-col gap-2 sm:flex-row">
                            <input type="hidden" name="topicId" value={t.id} />
                            <input name="text" required minLength={5} maxLength={500} autoFocus placeholder="How would you…?" className={inputClass} />
                            <SubmitButton size="md" variant="primary" pendingLabel="Adding…">
                              Add
                            </SubmitButton>
                          </ActionForm>
                        )}
                      </AddInline>
                    )}
                  </div>
                ))}
                {c.topics.length === 0 && <p className="text-sm text-muted">No topics yet.</p>}
              </div>

              {editable && (
                <AddInline label="Add topic" className="mt-3">
                  {(close) => (
                    <ActionForm action={createTopic} onSuccess={close} className="mt-2 grid gap-2 rounded-xl border border-dashed border-line p-3">
                      <input type="hidden" name="categoryId" value={c.id} />
                      <input name="name" required maxLength={120} autoFocus placeholder="Topic, e.g. Cord prolapse" className={inputClass} />
                      <input name="question" minLength={5} maxLength={500} placeholder="First question (needed before it can be spun)" className={inputClass} />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={close}>
                          Cancel
                        </Button>
                        <SubmitButton size="sm" variant="primary" pendingLabel="Adding…">
                          Add topic
                        </SubmitButton>
                      </div>
                    </ActionForm>
                  )}
                </AddInline>
              )}
            </div>
          )}
        </Card>
      ))}

      {editable && (
        <Card className="p-4">
          <ActionForm action={createCategory} resetOnSuccess className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm font-bold sm:w-36">New category</span>
            <input name="name" required maxLength={80} placeholder="e.g. Neonatal Resuscitation" className={inputClass} />
            <SubmitButton variant="primary" pendingLabel="Adding…">
              <PlusIcon className="h-4 w-4" /> Add
            </SubmitButton>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}

function MoveButton({ id, dir, disabled }: { id: string; dir: "up" | "down"; disabled: boolean }) {
  const Icon = dir === "up" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <ActionForm action={moveCategory}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="dir" value={dir} />
      <button disabled={disabled} aria-label={`Move ${dir}`} className="rounded p-0.5 text-muted hover:bg-line-soft hover:text-ink disabled:opacity-25">
        <Icon className="h-3.5 w-3.5" />
      </button>
    </ActionForm>
  );
}

function QuestionText({ q, editable }: { q: { id: string; text: string; rounds: number }; editable: boolean }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <ActionForm action={updateQuestion} onSuccess={() => setEditing(false)} className="flex w-full flex-col gap-2">
        <input type="hidden" name="id" value={q.id} />
        <textarea name="text" required minLength={5} maxLength={500} defaultValue={q.text} rows={2} autoFocus className="w-full rounded-lg border border-line p-2 text-[13px] outline-none focus:border-moss" />
        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <SubmitButton size="sm" variant="primary" pendingLabel="Saving…">
            Save
          </SubmitButton>
        </div>
      </ActionForm>
    );
  }
  return (
    <>
      <span className="min-w-0 flex-1">{q.text}</span>
      <span className="flex shrink-0 items-center gap-1">
        <span className="num text-xs text-muted">{q.rounds} saved</span>
        {editable && (
          <>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {q.rounds === 0 && (
              <ActionForm action={deleteQuestion}>
                <input type="hidden" name="id" value={q.id} />
                <ConfirmSubmit prompt="Delete?" confirmLabel="Delete">
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete question</span>
                </ConfirmSubmit>
              </ActionForm>
            )}
          </>
        )}
      </span>
    </>
  );
}

/** "Rename" button that turns into a one-field form. */
function InlineEdit({ action, id, name, value, label }: { action: Action; id: string; name: string; value: string; label: string }) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
        {label}
      </Button>
    );
  }
  return (
    <ActionForm action={action} onSuccess={() => setEditing(false)} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <input name={name} defaultValue={value} required maxLength={120} autoFocus className={cx(inputClass, "h-8 w-56")} />
      <SubmitButton size="sm" variant="primary">
        Save
      </SubmitButton>
      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </ActionForm>
  );
}

function AddInline({ label, className, children }: { label: string; className?: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  if (open) return <div className={className}>{children(() => setOpen(false))}</div>;
  return (
    <button onClick={() => setOpen(true)} className={cx("mt-2 inline-flex items-center gap-1 text-xs font-bold text-moss hover:underline", className)}>
      <PlusIcon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
