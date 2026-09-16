import React from "react";

export function Input({ type = "text", className = "", ...rest }) {
  return (
    <input
      type={type}
      className={`bg-white/5 border border-white/15 rounded-lg px-3 py-2 w-full text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    />
  );
}
