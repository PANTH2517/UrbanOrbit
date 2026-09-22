import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

/** An admin-access vector badge: a key that draws itself in, with a small
 * glint orbiting the bow to suggest it's the "special" key. */
export default function KeyBadge() {
  const angle = useMotionValue(0);
  useEffect(() => {
    const controls = animate(angle, 360, { duration: 6, repeat: Infinity, ease: "linear" });
    return controls.stop;
  }, [angle]);
  const rad = useTransform(angle, (a) => (a * Math.PI) / 180);
  const gx = useTransform(rad, (r) => 32 + 15 * Math.cos(r));
  const gy = useTransform(rad, (r) => 60 + 15 * Math.sin(r));

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full">
      <defs>
        <linearGradient id="uo-key-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="60"
        cy="60"
        r="34"
        fill="none"
        stroke="rgba(251,191,36,0.3)"
        strokeWidth="1"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.6, 0.2], scale: [0.8, 1.15, 1.15] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      <motion.g
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ transformOrigin: "60px 60px" }}
      >
        <g transform="rotate(-40 60 60)">
          <circle cx="32" cy="60" r="15" fill="url(#uo-key-grad)" stroke="#fff7ed" strokeOpacity="0.4" strokeWidth="1" />
          <circle cx="32" cy="60" r="6" fill="#05070f" />
          <rect x="46" y="55" width="42" height="10" rx="2" fill="url(#uo-key-grad)" />
          <rect x="72" y="65" width="6" height="10" rx="1.5" fill="url(#uo-key-grad)" />
          <rect x="82" y="65" width="6" height="14" rx="1.5" fill="url(#uo-key-grad)" />
          <motion.circle style={{ cx: gx, cy: gy }} r="2.2" fill="#fff7ed">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" repeatCount="indefinite" />
          </motion.circle>
        </g>
      </motion.g>
    </svg>
  );
}
