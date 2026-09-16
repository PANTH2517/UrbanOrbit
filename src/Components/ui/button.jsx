import React from "react";

const variants = {
  default:
    "bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 text-white shadow-[0_0_20px_rgba(56,242,255,0.25)] hover:shadow-[0_0_30px_rgba(56,242,255,0.45)] hover:brightness-110",
  outline:
    "bg-white/5 border border-white/15 text-slate-100 hover:bg-white/10 hover:border-cyan-400/40",
  ghost: "bg-transparent text-slate-200 hover:bg-white/10",
  destructive:
    "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.25)] hover:shadow-[0_0_30px_rgba(244,63,94,0.45)]",
  secondary: "bg-white/10 text-slate-100 hover:bg-white/15 border border-white/10",
};

const sizes = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
  icon: "p-2",
};

export function Button({
  children,
  onClick,
  className = "",
  variant = "default",
  size = "default",
  type = "button",
  disabled = false,
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:brightness-100 active:scale-[0.97] ${
        variants[variant] || variants.default
      } ${sizes[size] || sizes.default} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
