import React from "react";
import { motion } from "framer-motion";

// No `filter` here (a blur transition was tried and dropped): framer-motion
// keeps re-asserting an animated property's resolved value on every render,
// so even the resting "blur(0px)" stays in the inline style permanently.
// Any non-"none" filter on this wrapper makes it a containing block for
// `position: fixed` descendants (e.g. StarfieldBackground), silently
// turning them into page-scrolling `absolute` elements - invisible on
// short pages, but it blacks out the fixed background on any page taller
// than the viewport once you scroll.
const variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      // h-full, not min-h-full: min-height doesn't count as a "definite"
      // height for CSS purposes, so any page using percentage-based flex
      // children (height: 100%, h-full) to fill available space couldn't
      // resolve against this wrapper - they'd collapse to content size
      // instead of stretching. A page with more content than the viewport
      // still scrolls correctly either way (overflow: visible here just
      // lets it spill past this box, which the ancestor's overflow-auto
      // still measures and scrolls).
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
