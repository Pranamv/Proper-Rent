"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import {
  staggerContainerVariants,
  staggerItemVariants,
  VIEWPORT_ONCE,
} from "@/lib/motion";

type StaggerProps = {
  as?: "div" | "ol" | "section";
  className?: string;
  id?: string;
  "aria-label"?: string;
  children: ReactNode;
};

export function Stagger({
  as = "div",
  className,
  id,
  "aria-label": ariaLabel,
  children,
}: StaggerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    if (as === "ol") {
      return (
        <ol className={className} id={id} aria-label={ariaLabel}>
          {children}
        </ol>
      );
    }
    if (as === "section") {
      return (
        <section className={className} id={id} aria-label={ariaLabel}>
          {children}
        </section>
      );
    }
    return (
      <div className={className} id={id} aria-label={ariaLabel}>
        {children}
      </div>
    );
  }

  if (as === "ol") {
    return (
      <motion.ol
        className={className}
        id={id}
        aria-label={ariaLabel}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={staggerContainerVariants}
      >
        {children}
      </motion.ol>
    );
  }

  if (as === "section") {
    return (
      <motion.section
        className={className}
        id={id}
        aria-label={ariaLabel}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        variants={staggerContainerVariants}
      >
        {children}
      </motion.section>
    );
  }

  return (
    <motion.div
      className={className}
      id={id}
      aria-label={ariaLabel}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT_ONCE}
      variants={staggerContainerVariants}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = {
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
};

export function StaggerItem({ as = "div", className, children }: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    if (as === "li") {
      return <li className={className}>{children}</li>;
    }
    return <div className={className}>{children}</div>;
  }

  if (as === "li") {
    return (
      <motion.li className={className} variants={staggerItemVariants}>
        {children}
      </motion.li>
    );
  }

  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}
