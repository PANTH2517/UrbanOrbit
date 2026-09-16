import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio } from "lucide-react";
import { Issue } from "../../entities/Issues";
import { problemTypes } from "../problems/ProblemSelector";
import { relativeTime } from "./relativeTime";

const STATUS_DOT = {
  pending: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]",
  in_progress: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  completed: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
};

/**
 * Real-time feed of the most recent issues, backed by a live Firestore
 * onSnapshot subscription (not polling) - new reports and status changes
 * appear here the moment they're written.
 */
export default function LiveActivityFeed({ max = 8, emptyText = "No activity yet - be the first to report something." }) {
  const [items, setItems] = useState(null); // null = loading
  const [, forceTick] = useState(0);

  useEffect(() => {
    const unsubscribe = Issue.subscribeRecent(setItems, { max });
    return unsubscribe;
  }, [max]);

  // Re-render periodically so "2m ago" style timestamps keep advancing.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {items === null &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}

        {items?.length === 0 && (
          <p className="text-sm text-slate-500 py-6 text-center">{emptyText}</p>
        )}

        {items?.map((issue) => {
          const meta = problemTypes.find((p) => p.id === issue.problem_type);
          return (
            <motion.div
              key={issue.id}
              layout
              initial={{ opacity: 0, x: -12, backgroundColor: "rgba(56,242,255,0.12)" }}
              animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255,255,255,0)" }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <span className="text-xl shrink-0">{meta?.icon || "📍"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{issue.title}</p>
                <p className="text-xs text-slate-500 truncate">
                  {meta?.label || issue.problem_type} · {issue.address || "Location on map"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[issue.status] || "bg-slate-400"}`} />
                <span className="text-[10px] text-slate-500 whitespace-nowrap">{relativeTime(issue.created_date)}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
      <Radio className="w-3.5 h-3.5 animate-uo-twinkle" /> Live
    </span>
  );
}
