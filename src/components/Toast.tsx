"use client";

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  useEffect,
  type ReactNode,
} from "react";

/* ─── Types ─────────────────────────────────────────────────── */
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error:   (title: string, message?: string) => void;
  info:    (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

/* ─── Context ────────────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

/* ─── Toast item component ───────────────────────────────────── */
const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8.25h.008v.008H12V8.25z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
};

const PROGRESS_COLORS: Record<ToastType, string> = {
  success: "bg-emerald-500",
  error:   "bg-red-500",
  info:    "bg-blue-500",
  warning: "bg-amber-500",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    const timer = window.setTimeout(() => onRemove(toast.id), duration + 300);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="animate-toast-in pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-2xl border border-brand-navy/6 bg-white p-4 shadow-elevated dark:border-white/8 dark:bg-brand-navy-800"
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0">{ICONS[toast.type]}</div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-navy dark:text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{toast.message}</p>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/8 dark:hover:text-gray-200"
        aria-label="Cerrar"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${PROGRESS_COLORS[toast.type]} animate-progress-bar rounded-full`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}

/* ─── Provider ────────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((opts: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
  }, []);

  const ctx: ToastContextValue = {
    toast:   add,
    success: (title, message) => add({ type: "success", title, message }),
    error:   (title, message) => add({ type: "error",   title, message }),
    info:    (title, message) => add({ type: "info",    title, message }),
    warning: (title, message) => add({ type: "warning", title, message }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Portal-like fixed container */}
      <div
        aria-label="Notificaciones"
        className="pointer-events-none fixed bottom-6 right-4 z-[100] flex flex-col gap-2 sm:right-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ─── Hook ────────────────────────────────────────────────────── */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
