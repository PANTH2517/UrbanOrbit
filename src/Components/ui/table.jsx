import React from "react";

export function Table({ children, className = "" }) {
  return <table className={`w-full text-sm text-slate-200 ${className}`}>{children}</table>;
}

export function TableHeader({ children, className = "" }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className = "" }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className = "" }) {
  return <tr className={`border-b border-white/10 hover:bg-white/[0.03] transition-colors ${className}`}>{children}</tr>;
}

export function TableHead({ children, className = "" }) {
  return (
    <th className={`text-left font-semibold text-slate-400 text-xs uppercase tracking-wider px-4 py-3 ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
