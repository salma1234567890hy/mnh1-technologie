import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | MNH Technologie",
    default: "MNH Technologie",
  },
  description:
    "Nous concevons, développons et optimisons des solutions web, mobile et IA pour attirer plus de clients, automatiser les opérations et accélérer la croissance.",
};

/**
 * Minimal root layout: document, fonts and global styles only.
 * Public chrome (header, footer) lives in app/(public)/layout.tsx;
 * the Admin has its own shell in app/admin/layout.tsx.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
