// src/Components/ui/alert.jsx
import React from "react";

const variants = {
  default: "bg-white/5 border-white/15 text-slate-200",
  destructive: "bg-red-500/10 border-red-400/30 text-red-200",
};

export function Alert({ children, className = "", variant = "default" }) {
  const hasCustomColor = /\bbg-/.test(className);
  return (
    <div
      className={`p-4 rounded-xl border backdrop-blur-sm flex gap-3 items-start ${
        hasCustomColor ? "" : variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ children, className = "" }) {
  return <h4 className={`font-semibold ${className}`}>{children}</h4>;
}

export function AlertDescription({ children, className = "" }) {
  return <div className={`text-sm ${className}`}>{children}</div>;
}
