"use client";

import {
  createContext,
  useActionState,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import type { ActionResult } from "@/lib/types";
import { CheckIcon, CloseIcon } from "./icons";
import { Button, cx } from "./ui";

// ---- toasts ------------------------------------------------------------------

type Toast = { id: number; ok: boolean; message: string };
const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), t.ok ? 3500 : 6000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.ok ? "status" : "alert"}
            className={cx(
              "animate-toast pointer-events-auto flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg",
              t.ok ? "bg-ink text-cream" : "bg-danger text-white",
            )}
          >
            {t.ok ? <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-lime" /> : <CloseIcon className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---- forms -------------------------------------------------------------------

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/**
 * A form bound to a server action that reports its result as a toast.
 * `onSuccess` lets a dialog close or a field reset after it worked.
 */
export function ActionForm({
  action,
  children,
  onSuccess,
  resetOnSuccess,
  ...rest
}: Omit<ComponentProps<"form">, "action"> & {
  action: Action;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const toast = useToast();
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef<ActionResult>(null);

  useEffect(() => {
    if (!state || state === seen.current) return;
    seen.current = state;
    toast(state);
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
  }, [state, toast, onSuccess, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} {...rest}>
      {children}
    </form>
  );
}

/** Submit button that disables itself while its form is pending. */
export { SubmitButton } from "./submit-button";

/**
 * Two-step destructive submit: the first click asks, the second does it.
 * Avoids browser confirm() dialogs.
 */
export function ConfirmSubmit({
  children,
  confirmLabel = "Yes, do it",
  prompt = "Are you sure?",
  variant = "danger-ghost",
  size = "sm",
  className,
}: {
  children: ReactNode;
  confirmLabel?: string;
  prompt?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: "sm" | "md";
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setAsking(true)}>
        {children}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-muted">{prompt}</span>
      <Button type="submit" variant="danger" size="sm">
        {confirmLabel}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setAsking(false)}>
        Cancel
      </Button>
    </span>
  );
}
