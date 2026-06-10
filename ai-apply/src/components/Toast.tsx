"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

const BAR: Record<ToastType, string> = {
  success: "#10D8A4",
  error: "#FB7185",
  info: "#00F5FF",
};
const ICON: Record<ToastType, string> = {
  success: "✓",
  error: "!",
  info: "›",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 max-w-[90vw] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in pointer-events-auto flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[rgba(14,19,34,0.85)] p-3 text-sm text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur"
            style={{ borderLeft: `3px solid ${BAR[t.type]}` }}
          >
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: `${BAR[t.type]}22`, color: BAR[t.type] }}
            >
              {ICON[t.type]}
            </span>
            <span className="leading-snug">{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
