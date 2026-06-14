import type { Variants } from "motion/react";

export const VIEWPORT_ONCE = {
  amount: 0.2,
  once: true,
} as const;

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.23, 1, 0.32, 1],
    },
  },
} satisfies Variants;

export const staggerContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
} satisfies Variants;

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.23, 1, 0.32, 1],
    },
  },
} satisfies Variants;

export const motionClasses = {
  enter: "motion-safe:animate-fade-up motion-reduce:animate-none",
  interactive:
    "transition motion-reduce:transition-none motion-reduce:transform-none",
} as const;
