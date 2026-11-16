// lib/fonts.ts
// Polices du site, partagées par les deux layouts racines (app/[lang] et app/admin).

import { DM_Sans, Space_Grotesk } from "next/font/google";

export const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

/** Classes à poser sur <html>. */
export const fontVariables = `${dmSans.variable} ${spaceGrotesk.variable}`;
