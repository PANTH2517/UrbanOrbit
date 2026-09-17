import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

// Lightweight controlled combobox matching the shadcn-style API used across the app:
// <Select value={val} onValueChange={setVal}>
//   <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
//   <SelectContent><SelectItem value="x">Label</SelectItem></SelectContent>
// </Select>
const SelectContext = createContext(null);

export function Select({ value, onValueChange, children, className = "" }) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState({});
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const registerLabel = (itemValue, label) => {
    setLabels((prev) => (prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }));
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, labels, registerLabel }}>
      <div ref={rootRef} className={`relative inline-block w-full ${className}`}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className = "" }) {
  const ctx = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen((o) => !o)}
      className={`flex items-center justify-between w-full border border-white/15 rounded-lg px-3 py-2 bg-white/5 text-left text-sm text-slate-100 hover:bg-white/10 hover:border-cyan-400/40 transition-colors ${className}`}
    >
      {children}
      <ChevronDown className={`w-4 h-4 ml-2 text-slate-400 shrink-0 transition-transform ${ctx.open ? "rotate-180" : ""}`} />
    </button>
  );
}

export function SelectValue({ placeholder, children }) {
  const ctx = useContext(SelectContext);
  if (children) return children;
  const label = ctx.value != null ? ctx.labels?.[ctx.value] : null;
  return (
    <span className={ctx.value ? "" : "text-slate-500"}>
      {label || ctx.value || placeholder}
    </span>
  );
}

export function SelectContent({ children, className = "" }) {
  const ctx = useContext(SelectContext);
  // Always mounted (just hidden via CSS when closed), not conditionally
  // rendered - SelectItem registers its own display label in a mount
  // effect, so if this returned null while closed, no label would exist
  // until the dropdown had been opened at least once. Before that, the
  // trigger fell back to showing the raw value ("all") instead of its
  // label ("All Status").
  return (
    <div
      className={`absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-white/15 bg-[#0d1226]/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1 animate-[uo-fade-up_0.15s_ease-out] ${ctx.open ? "" : "hidden"} ${className}`}
    >
      {children}
    </div>
  );
}

function extractText(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (node.props?.children) return extractText(node.props.children);
  return "";
}

export function SelectItem({ value, children, className = "" }) {
  const ctx = useContext(SelectContext);
  const selected = ctx.value === value;

  useEffect(() => {
    const text = extractText(children).trim();
    if (text) ctx.registerLabel(value, text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, children]);

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => {
        ctx.onValueChange?.(value);
        ctx.setOpen(false);
      }}
      className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer text-slate-200 hover:bg-cyan-400/10 ${
        selected ? "bg-cyan-400/10 text-cyan-300 font-medium" : ""
      } ${className}`}
    >
      <span>{children}</span>
      {selected && <Check className="w-4 h-4 text-cyan-400" />}
    </div>
  );
}
