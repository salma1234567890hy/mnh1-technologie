"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { fadeInUp, inViewViewport, withDelay } from "@/lib/motion/variants";

/** Reduced motion: the content simply appears (no movement, no fade). */
const reducedVariants: Variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 1 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0 } },
};

type RevealProps = {
  children: ReactNode;
  /** One of the shared variants from lib/motion/variants.ts (default: fadeInUp). */
  variants?: Variants;
  /** Extra delay in seconds before the animation starts. */
  delay?: number;
  className?: string;
};

/**
 * Scroll-triggered entrance, played once (viewport `once: true`, margin -80px).
 * Honours prefers-reduced-motion. For above-the-fold content, prefer a CSS entrance
 * (see components/home/HeroReveal.tsx) so the text paints before hydration.
 */
export function Reveal({ children, variants = fadeInUp, delay = 0, className }: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const activeVariants = prefersReducedMotion
    ? reducedVariants
    : delay > 0
      ? withDelay(variants, delay)
      : variants;

  return (
    <motion.div
      className={className}
      variants={activeVariants}
      initial="hidden"
      whileInView="visible"
      viewport={inViewViewport}
    >
      {children}
    </motion.div>
  );
}
