"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

type HeroCounterProps = {
  value: number;
  label: string;
  /** Seconds to wait before counting (lets the entrance fade start first). */
  delay?: number;
};

/**
 * Counts from 0 to `value` in 2s (easeOut), once, when visible.
 * The number is a MotionValue rendered straight into the DOM (no React re-render per frame).
 * Screen readers get the final value only (the animated number is aria-hidden).
 */
export function HeroCounter({ value, label, delay = 0 }: HeroCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      count.set(value);
      return;
    }

    const controls = animate(count, value, { duration: 2, delay, ease: "easeOut" });
    return () => controls.stop();
  }, [isInView, prefersReducedMotion, value, delay, count]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <p className="font-heading text-4xl leading-none font-bold tracking-[-0.02em] text-mnh-text-white tabular-nums sm:text-5xl">
        <span aria-hidden="true">
          <motion.span>{rounded}</motion.span>
          <span className="text-mnh-accent">+</span>
        </span>
        <span className="sr-only">
          {value}+ {label}
        </span>
      </p>
      <p
        aria-hidden="true"
        className="mt-3 font-sans text-xs tracking-[0.05em] whitespace-nowrap text-mnh-text-muted-dark uppercase sm:text-sm"
      >
        {label}
      </p>
    </div>
  );
}
