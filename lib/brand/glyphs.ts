/**
 * MNH display glyphs — original drawings for the footer signature.
 *
 * Geometric, angular construction echoing the MNH monogram: thick stems (34 units),
 * 45° chamfers on the outer corners, straight diagonals, no curves.
 * All glyphs share the same viewBox so they line up and scale together.
 * Add a letter by adding an entry (one closed, non-self-intersecting path).
 */

export const GLYPH_VIEWBOX = "0 0 160 120";

export const glyphs = {
  M: "M0 120V14L14 0H40L80 44L120 0H146L160 14V120H126V56L80 104L34 56V120Z",
  N: "M0 120V14L14 0H46L126 82V0H160V106L146 120H114L34 38V120Z",
  H: "M0 14L14 0H34V45H126V0H160V106L146 120H126V75H34V120H0Z",
} as const;

export type GlyphKey = keyof typeof glyphs;
