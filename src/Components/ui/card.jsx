// src/Components/ui/card.jsx
import React from "react";

export function Card({ children, className = "", ...rest }) {
  return (
    <div
      className={`uo-panel uo-panel-glow rounded-2xl p-4 text-slate-100 transition-transform duration-300 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...rest }) {
  return (
    <div className={`mb-3 font-bold text-slate-100 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...rest }) {
  return (
    <h2 className={`text-lg font-semibold text-white ${className}`} {...rest}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className = "", ...rest }) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}
