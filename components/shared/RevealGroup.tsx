"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { fadeInUp, inViewViewport, staggerContainer } from "@/lib/motion/variants";

/** Reduced motion: no stagger, no movement — children simply appear. */
const reducedGroup: Variants = { hidden: {}, visible: {} };
const reducedItem: Variants = {
  hidden: { opacity: 0, x: 0, y: 0, scale: 1 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0 } },
};

const groupElements = { div: motion.div, ul: motion.ul } as const;
const itemElements = { div: motion.div, li: motion.li } as const;

type RevealGroupProps = {
  children: ReactNode;
  /** Rendered element: "ul" for a list of cards (then use RevealItem as="li"). */
  as?: keyof typeof groupElements;
  /** Parent variants (default: staggerContainer — 0.12s between children). */
  variants?: Variants;
  className?: string;
};

/**
 * Scroll-triggered staggered entrance of its RevealItem children, played once
 * (viewport once, margin -80px). Honours prefers-reduced-motion.
 */
export function RevealGroup({ children, as = "div", variants = staggerContainer, className }: RevealGroupProps) {
  const prefersReducedMotion = useReducedMotion();
  const Element = groupElements[as];
  return (
    <Element
      className={className}
      variants={prefersReducedMotion ? reducedGroup : variants}
      initial="hidden"
      whileInView="visible"
      viewport={inViewViewport}
    >
      {children}
    </Element>
  );
}

type RevealItemProps = {
  children: ReactNode;
  as?: keyof typeof itemElements;
  /** Child variants (default: fadeInUp). */
  variants?: Variants;
  className?: string;
};

/** One child of a RevealGroup (inherits the group's hidden/visible state). */
export function RevealItem({ children, as = "div", variants = fadeInUp, className }: RevealItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const Element = itemElements[as];
  return (
    <Element className={className} variants={prefersReducedMotion ? reducedItem : variants}>
      {children}
    </Element>
  );
}
