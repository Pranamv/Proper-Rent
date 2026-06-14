"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { fadeUpVariants, VIEWPORT_ONCE } from "@/lib/motion";

type RevealProps = {
  as?: "div" | "section";
  className?: string;
  children: ReactNode;
};

export function Reveal({ as = "div", className, children }: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    if (as === "section") {
      return <section className={className}>{children}</section>;
    }
    return <div className={className}>{children}</div>;
  }

  if (as === "section") {
    return (
      <motion.section
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={fadeUpVariants}
      >
        {children}
      </motion.section>
    );
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_ONCE}
      variants={fadeUpVariants}
    >
      {children}
    </motion.div>
  );
}
