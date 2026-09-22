import React from "react";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/** A citizen/community vector badge: a person silhouette with a small
 * "report" pin overlapping the shoulder, echoing the pin-drop feature
 * illustration on the landing page. */
export default function PersonBadge() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <defs>
        <linearGradient id="uo-person-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7fd9ff" />
          <stop offset="100%" stopColor="#4d7bff" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="60"
        cy="58"
        r="34"
        fill="none"
        stroke="rgba(56,242,255,0.3)"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.6, 0.2], scale: [0.8, 1.15, 1.15] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      <motion.g
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <circle cx="60" cy="44" r="14" fill="url(#uo-person-grad)" />
        <path
          d="M32 92c1-16 12.5-26 28-26s27 10 28 26c0 2-1.5 3-3 3H35c-1.5 0-3-1-3-3z"
          fill="url(#uo-person-grad)"
        />
      </motion.g>

      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 260, damping: 14 }}
      >
        <circle cx="86" cy="80" r="13" fill="#05070f" />
        <path d="M86 71c-4.4 0-8 3.5-8 7.8 0 5.4 8 12.2 8 12.2s8-6.8 8-12.2c0-4.3-3.6-7.8-8-7.8z" fill="#38f2ff" />
        <circle cx="86" cy="78.5" r="2.6" fill="#05070f" />
      </motion.g>
    </svg>
  );
}
