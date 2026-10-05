"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";
import { cx } from "./ui";

/** Native <dialog>: focus trap, Esc to close and a backdrop for free. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx(
        "m-auto w-[min(480px,calc(100vw-2rem))] rounded-2xl border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-night/60",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
        <h2 className="font-bold">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-muted hover:bg-line-soft hover:text-ink">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
      <div className={cx("p-5", bodyClassName)}>{open && children}</div>
    </dialog>
  );
}
