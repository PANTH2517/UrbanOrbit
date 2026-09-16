import React from "react";

export function Label({ htmlFor, children, className = "", ...rest }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-slate-300 mb-1 ${className}`}
      {...rest}
    >
      {children}
    </label>
  );
}
