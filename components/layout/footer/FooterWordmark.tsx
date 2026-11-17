"use client";

import { useState, type PointerEvent } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { GLYPH_VIEWBOX, glyphs, type GlyphKey } from "@/lib/brand/glyphs";
import { EASE_STANDARD, inViewViewport } from "@/lib/motion/variants";

const LETTERS: GlyphKey[] = ["M", "N", "H"];

const rowVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const letterEntrance: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_STANDARD } },
};

/** Reduced motion: letters simply appear (no movement, no fade). */
const letterEntranceReduced: Variants = {
  hidden: { opacity: 0, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

const hoverSpring = { type: "spring", stiffness: 450, damping: 25, mass: 0.8 } as const;
const tapSpring = { type: "spring", stiffness: 600, damping: 30 } as const;

const REST = { scale: 1, y: 0 };
const LIFTED = { scale: 1.04, y: -8 };

/**
 * Giant "MNH" signature. Each glyph springs up and turns green when the MOUSE is over it,
 * and squashes (green while pressed) on tap.
 * Reduced motion: no entrance, no spring — only the colour changes.
 */
export function FooterWordmark({ label }: { label: string }) {
  const prefersReducedMotion = useReducedMotion();
  const animated = !prefersReducedMotion;

  return (
    <div className="relative">
      <span className="sr-only">{label}</span>
      <motion.div
        aria-hidden="true"
        className="mx-auto flex max-w-[1240px] flex-nowrap items-end gap-[2.5%] overflow-visible pt-6"
        variants={rowVariants}
        initial="hidden"
        whileInView="visible"
        viewport={inViewViewport}
      >
        {LETTERS.map((letter) => (
          <WordmarkLetter key={letter} letter={letter} animated={animated} />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * One glyph. The hover effect is driven by pointer events with pointerType === "mouse",
 * NOT by CSS :hover: Tailwind's `hover:` only applies under @media (hover: hover), which is
 * false on touch-screen laptops in some browsers (e.g. Brave), even when a mouse is used.
 * Touch keeps the previous behaviour: green while pressed (active:) + squash (whileTap).
 * The entrance animation stays on the parent motion.div (separate element, separate transform).
 */
function WordmarkLetter({ letter, animated }: { letter: GlyphKey; animated: boolean }) {
  const [mouseOver, setMouseOver] = useState(false);

  const onPointerEnter = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse") setMouseOver(true);
  };
  const onPointerLeave = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "mouse") setMouseOver(false);
  };

  return (
    <motion.div
      variants={animated ? letterEntrance : letterEntranceReduced}
      className="min-w-0 flex-[1_1_0] overflow-visible"
    >
      <motion.svg
        viewBox={GLYPH_VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        fill="currentColor"
        fillRule="evenodd"
        focusable="false"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        className={cn(
          "block h-auto w-full origin-bottom cursor-default overflow-visible text-mnh-text-white/92 transition-[color,filter] duration-250 ease-out select-none active:text-mnh-accent",
          mouseOver && "text-mnh-accent drop-shadow-[0_0_24px_color-mix(in_srgb,var(--mnh-accent)_35%,transparent)]",
        )}
        animate={animated ? (mouseOver ? LIFTED : REST) : undefined}
        whileTap={animated ? { scale: 0.96, y: 2, transition: tapSpring } : undefined}
        transition={hoverSpring}
      >
        <path d={glyphs[letter]} />
      </motion.svg>
    </motion.div>
  );
}
