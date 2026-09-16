import React, { useEffect } from "react";
import { X } from "lucide-react";

// Lightweight controlled dialog matching the shadcn-style API used across the app:
// <Dialog open={bool} onOpenChange={(open) => ...}>
export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[uo-fade-up_0.2s_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange?.(false);
      }}
    >
      {children}
    </div>
  );
}

export function DialogContent({ children, className = "" }) {
  return (
    <div
      className={`uo-panel uo-panel-glow relative w-full rounded-2xl p-6 text-slate-100 ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ background: "rgba(10, 14, 31, 0.92)" }}
    >
      {children}
    </div>
  );
}

export function DialogClose({ onClose }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute top-4 right-4 text-slate-400 hover:text-cyan-300 transition-colors"
      aria-label="Close"
    >
      <X className="w-5 h-5" />
    </button>
  );
}

export function DialogHeader({ children, className = "" }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }) {
  return <h2 className={`text-xl font-bold text-white ${className}`}>{children}</h2>;
}

export function DialogDescription({ children, className = "" }) {
  return <p className={`mt-1 text-sm text-slate-400 ${className}`}>{children}</p>;
}
