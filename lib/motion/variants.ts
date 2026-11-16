import type { Transition, Variants } from "framer-motion";

/**
 * Shared Framer Motion variants — « Néon Subtil » (docs/design-spec.md › Animations globales).
 *
 * Usage (scroll-triggered sections):
 *   <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={inViewViewport} />
 * Usage (above the fold): initial="hidden" animate="visible".
 *
 * Exception — Hero entrance: it uses a CSS equivalent of `fadeInUp`
 * (components/home/HeroReveal.tsx) so the LCP text paints before hydration.
 */

export const EASE_STANDARD = [0.25, 0.46, 0.45, 0.94] as const;

export const inViewViewport = { once: true, margin: "-80px" } as const;

const baseTransition: Transition = { duration: 0.7, ease: EASE_STANDARD };

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: baseTransition },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: baseTransition },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: baseTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

/** Returns a copy of `variants` whose "visible" state starts after `delay` seconds. */
export function withDelay(variants: Variants, delay: number): Variants {
  const visible = variants.visible;
  if (!visible || typeof visible === "function") return variants;
  return {
    ...variants,
    visible: {
      ...visible,
      transition: { ...(visible.transition as Transition | undefined), delay },
    },
  };
}
