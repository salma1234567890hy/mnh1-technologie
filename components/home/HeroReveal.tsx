import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroRevealProps = {
  children: ReactNode;
  /** Entrance delay in seconds (badge 0 · H1 0.15 · text 0.35 · CTAs 0.45 · counters 0.55+). */
  delay?: number;
  /**
   * Start opacity of the fade. Chrome never counts an element first painted at
   * opacity 0 as the LCP, so the H1 starts at 0.01 (visually identical).
   */
  fromOpacity?: number;
  className?: string;
};

/**
 * Above-the-fold entrance — CSS version of the shared `fadeInUp` variant
 * (lib/motion/variants.ts: opacity 0 → 1, y 40px → 0, 0.7s, ease [0.25,0.46,0.45,0.94]).
 *
 * Why CSS and not Framer Motion here: the Hero is visible on load, and a JS-driven
 * entrance keeps the H1 at opacity 0 until hydration (≈3s on a throttled mobile → LCP 3.9s).
 * CSS keyframes (tw-animate-css) start with the first paint, before any JS.
 * prefers-reduced-motion: the global rule in globals.css shortens animations to ~0ms.
 */
export function HeroReveal({ children, delay = 0, fromOpacity = 0, className }: HeroRevealProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-10 fill-mode-both duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
        className,
      )}
      style={
        {
          animationDelay: `${delay}s`,
          "--tw-enter-opacity": fromOpacity,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
