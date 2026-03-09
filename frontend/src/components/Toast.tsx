/* Issue #159 — Minimal toast notification component
   Fixed bottom-right stack. Auto-dismisses after a timeout.
   Supports optional action button (e.g. "Play Now" for tournament matches).
   No external dependencies — just React + Tailwind. */

import { useCallback, useEffect, useState } from "react";

type ToastVariant = "info" | "success" | "warning" | "error";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  duration: number;
}

const variantStyles: Record<ToastVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

const actionStyles: Record<ToastVariant, string> = {
  info: "bg-blue-600 hover:bg-blue-700",
  success: "bg-emerald-600 hover:bg-emerald-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  error: "bg-red-600 hover:bg-red-700",
};

let nextId = 0;
let globalAddToast:
  | ((
      message: string,
      variant?: ToastVariant,
      opts?: { action?: ToastAction; duration?: number },
    ) => void)
  | null = null;

/* Call this from anywhere to show a toast.
   Pass opts.action for a clickable button, opts.duration to override auto-dismiss. */
export function showToast(
  message: string,
  variant: ToastVariant = "info",
  opts?: { action?: ToastAction; duration?: number },
) {
  globalAddToast?.(message, variant, opts);
}

/* Render this once at the app root (e.g. in App.tsx). */
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (
      message: string,
      variant: ToastVariant = "info",
      opts?: { action?: ToastAction; duration?: number },
    ) => {
      const id = nextId++;
      const duration = opts?.duration ?? 5000;
      setToasts((prev) => [
        ...prev,
        { id, message, variant, action: opts?.action, duration },
      ]);
    },
    [],
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

function ToastMessage({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  /* duration === 0 means sticky — user must dismiss manually or click the action */
  useEffect(() => {
    if (toast.duration === 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      className={`max-w-sm rounded-lg border px-4 py-3 text-sm shadow-md animate-in ${variantStyles[toast.variant]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span>{toast.message}</span>
        <button
          type="button"
          className="ml-2 shrink-0 opacity-50 hover:opacity-100"
          onClick={() => onDismiss(toast.id)}
        >
          x
        </button>
      </div>
      {toast.action && (
        <button
          type="button"
          className={`mt-2 w-full rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors ${actionStyles[toast.variant]}`}
          onClick={() => {
            toast.action!.onClick();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  );
}
