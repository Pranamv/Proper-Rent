"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { fadeUpVariants, VIEWPORT_ONCE } from "@/lib/motion";

type RevealProps = {
  as?: "div" | "section";
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
};

export function Reveal({
  as = "div",
  className,
  id,
  "aria-labelledby": ariaLabelledBy,
  children,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    if (as === "section") {
      return (
        <section className={className} id={id} aria-labelledby={ariaLabelledBy}>
          {children}
        </section>
      );
    }
    return (
      <div className={className} id={id} aria-labelledby={ariaLabelledBy}>
        {children}
      </div>
    );
  }

  if (as === "section") {
    return (
      <motion.section
        className={className}
        id={id}
        aria-labelledby={ariaLabelledBy}
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
      id={id}
      aria-labelledby={ariaLabelledBy}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_ONCE}
      variants={fadeUpVariants}
    >
      {children}
    </motion.div>
  );
}
