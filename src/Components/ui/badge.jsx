import React from "react";

const variants = {
  default: "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30",
  secondary: "bg-white/10 text-slate-200 border border-white/15",
  destructive: "bg-red-500/15 text-red-300 border border-red-400/30",
  outline: "bg-transparent border border-white/25 text-slate-200",
};

export function Badge({ children, variant = "default", color, className = "" }) {
  const colorStyles = {
    blue: "bg-blue-500/15 text-blue-300 border border-blue-400/30",
    green: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
    red: "bg-red-500/15 text-red-300 border border-red-400/30",
    yellow: "bg-amber-500/15 text-amber-300 border border-amber-400/30",
    gray: "bg-white/10 text-slate-300 border border-white/15",
  };

  const hasCustomColor = /\b(bg|text)-/.test(className);
  const base = hasCustomColor ? "" : color ? colorStyles[color] : variants[variant] || variants.default;

  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm ${base} ${className}`}
    >
      {children}
    </span>
  );
}
