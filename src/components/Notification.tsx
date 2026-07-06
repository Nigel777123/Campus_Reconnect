import React from "react";
import { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType; }

interface Ctx {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
}

const NotifCtx = createContext<Ctx>({ success: () => {}, error: () => {}, info: () => {} });

let nextId = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType) => {
    const id = ++nextId;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const ctx = { success: (m: string) => add(m, "success"), error: (m: string) => add(m, "error"), info: (m: string) => add(m, "info") };

  return (
    <NotifCtx.Provider value={ctx}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span style={{ marginTop: "1px", flexShrink: 0 }}>
              {t.type === "success" && <CheckCircle size={16} />}
              {t.type === "error"   && <AlertCircle size={16} />}
              {t.type === "info"    && <Info size={16} />}
            </span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button onClick={() => dismiss(t.id)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 0, color: "inherit", opacity: .6, flexShrink: 0, display: "flex",
            }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotifCtx.Provider>
  );
}

export function useNotification() { return useContext(NotifCtx); }
