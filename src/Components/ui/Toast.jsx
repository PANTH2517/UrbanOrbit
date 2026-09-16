import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle, accent: "text-emerald-400", border: "border-emerald-400/30" },
  error: { icon: XCircle, accent: "text-red-400", border: "border-red-400/30" },
  warning: { icon: AlertTriangle, accent: "text-amber-400", border: "border-amber-400/30" },
  info: { icon: Info, accent: "text-cyan-400", border: "border-cyan-400/30" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, variant = "info", duration = 5000) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration);
    }
    return id;
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const { icon: Icon, accent, border } = VARIANTS[t.variant] || VARIANTS.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`uo-panel pointer-events-auto rounded-xl border ${border} p-3 pr-2 shadow-lg flex items-start gap-2`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${accent}`} />
                <p className="text-sm text-slate-100 flex-1">{t.message}</p>
                <button
                  onClick={() => dismissToast(t.id)}
                  className="text-slate-500 hover:text-slate-300 shrink-0 p-1"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
