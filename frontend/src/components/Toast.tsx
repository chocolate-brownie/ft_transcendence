/* Issue #159 — Minimal toast notification component
   Fixed bottom-right stack. Auto-dismisses after a timeout.
   No external dependencies — just React + Tailwind. */

import { useCallback, useEffect, useState } from "react";

type ToastVariant = "info" | "success" | "warning" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

let nextId = 0;
let globalAddToast: ((message: string, variant?: ToastVariant) => void) | null = null;

/* Call this from anywhere to show a toast. */
export function showToast(message: string, variant: ToastVariant = "info") {
  globalAddToast?.(message, variant);
}

/* Render this once at the app root (e.g. in App.tsx). */
export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

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
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

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
    </div>
  );
}
