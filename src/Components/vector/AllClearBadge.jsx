import React from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/** A small "nothing to review" empty-state illustration: a radar sweep
 * finds nothing, then a checkmark settles in. Used in place of a plain
 * text empty state on admin/official list views. */
export default function AllClearBadge() {
  return (
    <svg viewBox="0 0 120 80" className="w-24 h-16 mx-auto">
      <defs>
        <linearGradient id="uo-clear-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="60"
        cy="40"
        r="26"
        fill="none"
        stroke="rgba(52,211,153,0.25)"
        strokeWidth="1"
        strokeDasharray="2 5"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1, rotate: 360 }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.5 },
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
        }}
        style={{ transformOrigin: "60px 40px" }}
      />

      <motion.circle
        cx="60"
        cy="40"
        r="16"
        fill="url(#uo-clear-grad)"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 260, damping: 14 }}
      />
      <motion.path
        d="M52 40 l6 6 l12-13"
        fill="none"
        stroke="#05070f"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4, ease: EASE }}
      />
    </svg>
  );
}
