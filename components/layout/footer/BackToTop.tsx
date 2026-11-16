"use client";

import { ArrowUp } from "lucide-react";

export function BackToTop() {
  function scrollToTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-mnh-dark-border text-mnh-text-muted-dark transition-colors duration-200 ease-out hover:border-mnh-accent hover:bg-mnh-accent hover:text-mnh-black"
    >
      <ArrowUp aria-hidden="true" size={16} />
    </button>
  );
}
