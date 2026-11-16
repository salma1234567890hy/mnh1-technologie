"use client";

import { ArrowUp } from "lucide-react";

export function BackToTop({ label }: { label: string }) {
  function scrollToTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
    // Keyboard and screen reader users continue from the top: focus the main content
    // (<main id="main" tabIndex={-1}>) without triggering another scroll.
    document.getElementById("main")?.focus({ preventScroll: true });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-mnh-dark-border text-mnh-text-muted-dark transition-colors duration-200 ease-out hover:border-mnh-accent hover:bg-mnh-accent hover:text-mnh-black"
    >
      <ArrowUp aria-hidden="true" size={16} />
    </button>
  );
}
