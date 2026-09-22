import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

/**
 * A vector satellite orbiting a vector city-hub, replacing the old
 * CSS-ring hero graphic. The satellites' positions are driven by real
 * motion values (not just a CSS rotation), so the signal beam can track
 * the primary satellite exactly on every frame instead of approximating.
 */
function useOrbitPosition(center, radius, duration, direction = 1) {
  const angle = useMotionValue(0);
  useEffect(() => {
    const controls = animate(angle, direction * 360, {
      duration,
      repeat: Infinity,
      ease: "linear",
    });
    return controls.stop;
  }, [angle, duration, direction]);

  const x = useTransform(angle, (a) => center + radius * Math.cos((a * Math.PI) / 180));
  const y = useTransform(angle, (a) => center + radius * Math.sin((a * Math.PI) / 180));
  return { x, y };
}

export default function OrbitHero() {
  const CENTER = 160;
  const sat1 = useOrbitPosition(CENTER, 140, 16, 1);
  const sat2 = useOrbitPosition(CENTER, 100, 10, -1);

  return (
    <svg viewBox="0 0 320 320" className="w-full h-full overflow-visible">
      <defs>
        <radialGradient id="uo-hero-planet" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#7fd9ff" />
          <stop offset="45%" stopColor="#4d7bff" />
          <stop offset="100%" stopColor="#7b2ff7" />
        </radialGradient>
        <linearGradient id="uo-hero-sat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38f2ff" />
          <stop offset="100%" stopColor="#a259ff" />
        </linearGradient>
        <clipPath id="uo-hero-clip">
          <circle cx={CENTER} cy={CENTER} r="54" />
        </clipPath>
      </defs>

      {/* Orbit rings, drawn in on mount */}
      <motion.circle
        cx={CENTER}
        cy={CENTER}
        r="140"
        fill="none"
        stroke="rgba(56,242,255,0.28)"
        strokeWidth="1"
        strokeDasharray="3 7"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <motion.circle
        cx={CENTER}
        cy={CENTER}
        r="100"
        fill="none"
        stroke="rgba(162,89,255,0.28)"
        strokeWidth="1"
        strokeDasharray="2 6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.2, ease: "easeOut" }}
      />

      {/* Signal beam - tracks the primary satellite live every frame */}
      <motion.line
        x1={sat1.x}
        y1={sat1.y}
        x2={CENTER}
        y2={CENTER}
        stroke="url(#uo-hero-sat)"
        strokeWidth="1"
        strokeDasharray="2 5"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* City-hub planet with a faint skyline silhouette */}
      <circle cx={CENTER} cy={CENTER} r="54" fill="url(#uo-hero-planet)" />
      <g clipPath="url(#uo-hero-clip)" opacity="0.4">
        <rect x="121" y="185" width="9" height="32" fill="#03050c" />
        <rect x="133" y="172" width="9" height="45" fill="#03050c" />
        <rect x="145" y="190" width="9" height="27" fill="#03050c" />
        <rect x="157" y="165" width="9" height="52" fill="#03050c" />
        <rect x="169" y="180" width="9" height="37" fill="#03050c" />
        <rect x="181" y="193" width="9" height="24" fill="#03050c" />
      </g>
      <motion.circle
        cx={CENTER}
        cy={CENTER}
        r="54"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
        animate={{ r: [54, 62, 54], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
      />

      {/* Secondary satellite - simple pulsing marker on the inner ring */}
      <motion.circle style={{ cx: sat2.x, cy: sat2.y }} r="3" fill="#a259ff">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.4s" repeatCount="indefinite" />
      </motion.circle>

      {/* Primary satellite - vector body, panels, and antenna, riding the outer ring */}
      <motion.g style={{ translateX: sat1.x, translateY: sat1.y }}>
        <g transform="rotate(30)">
          <rect x="-9" y="-3" width="18" height="6" rx="1.5" fill="url(#uo-hero-sat)" />
          <rect x="-19" y="-5" width="8" height="10" rx="1" fill="#38f2ff" opacity="0.85" />
          <rect x="11" y="-5" width="8" height="10" rx="1" fill="#38f2ff" opacity="0.85" />
          <line x1="0" y1="-3" x2="0" y2="-11" stroke="#eaf1ff" strokeWidth="1" />
          <circle cx="0" cy="-11" r="1.6" fill="#eaf1ff" />
        </g>
      </motion.g>
    </svg>
  );
}
