import React from "react";

export function Textarea({ className = "", ...rest }) {
  return (
    <textarea
      className={`bg-white/5 border border-white/15 rounded-lg p-2 w-full text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    />
  );
}
