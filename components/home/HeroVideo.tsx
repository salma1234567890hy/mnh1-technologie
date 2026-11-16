"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const POSTER = "/videos/hero-poster.webp";

const DESKTOP_SOURCES = [
  { src: "/videos/hero-bg.webm", type: "video/webm" },
  { src: "/videos/hero-bg-opt.mp4", type: "video/mp4" },
];
const MOBILE_SOURCES = [{ src: "/videos/hero-bg-mobile.mp4", type: "video/mp4" }];

type Source = { src: string; type: string };

type NetworkInformation = { saveData?: boolean };

/** Video is skipped (poster only) for reduced motion or data-saver users. */
function shouldUsePosterOnly() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return reducedMotion || connection?.saveData === true;
}

/**
 * Background video of the Hero.
 * - The poster is server-rendered, so text and background show immediately.
 * - Sources are chosen on mount (mobile < 768px), so there is no hydration mismatch.
 * - Paused while the Hero is off-screen; poster kept if autoplay is refused.
 */
export function HeroVideo({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sources, setSources] = useState<Source[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Decide once on mount whether to load a video, and which one.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (shouldUsePosterOnly()) return;
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      setSources(isMobile ? MOBILE_SOURCES : DESKTOP_SOURCES);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Play only while the Hero is visible; switch to poster if motion becomes reduced.
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!sources || !video || !container) return;

    video.muted = true; // required for autoplay; React does not always reflect `muted`
    let isVisible = true;

    const tryPlay = () => {
      // Autoplay can be refused (power saving, browser policy): keep the poster silently.
      video.play().catch(() => setIsPlaying(false));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) tryPlay();
        else video.pause();
      },
      { threshold: 0 },
    );
    observer.observe(container);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = () => {
      if (motionQuery.matches) {
        video.pause();
        setSources(null);
      }
    };
    motionQuery.addEventListener("change", handleMotionChange);

    if (isVisible) tryPlay();

    return () => {
      observer.disconnect();
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, [sources]);

  return (
    <div ref={containerRef} aria-hidden="true" className={cn("absolute inset-0 z-0", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static poster, same file as the video poster */}
      <img
        src={POSTER}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
      {sources && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          disablePictureInPicture
          tabIndex={-1}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
            isPlaying ? "opacity-100" : "opacity-0",
          )}
        >
          {sources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>
      )}
    </div>
  );
}
