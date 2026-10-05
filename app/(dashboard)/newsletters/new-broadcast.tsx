"use client";

import { useTransition } from "react";
import { createFromTemplate } from "@/app/actions/newsletters";
import { BookIcon, MailIcon, SettingsIcon, Sparkle, UsersIcon } from "@/components/icons";
import { cx } from "@/components/ui";
import { KIND_INFO } from "@/lib/broadcast-templates";
import type { BroadcastKind } from "@/lib/types";

const ICONS: Record<BroadcastKind, (p: { className?: string }) => React.ReactNode> = {
  newsletter: MailIcon,
  feature_update: Sparkle,
  announcement: BookIcon,
  maintenance: SettingsIcon,
  direct: UsersIcon,
};

export function NewBroadcast() {
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-2 p-5 pt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {(Object.keys(KIND_INFO) as BroadcastKind[]).map((kind) => {
        const Icon = ICONS[kind];
        return (
          <button
            key={kind}
            disabled={pending}
            onClick={() => start(() => createFromTemplate(kind))}
            className={cx(
              "group flex flex-col items-start justify-start rounded-xl border border-line p-4 text-left transition-colors hover:border-moss hover:bg-canvas/60 disabled:opacity-60",
              kind === "maintenance" && "border-dashed",
            )}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-ink">
              <Icon className="h-4 w-4" />
            </span>
            <span className="mt-3 block font-bold">{KIND_INFO[kind].label}</span>
            <span className="mt-1 block text-xs text-muted">{KIND_INFO[kind].description}</span>
          </button>
        );
      })}
    </div>
  );
}
