import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HeroCounter } from "@/components/home/HeroCounter";
import { HeroReveal } from "@/components/home/HeroReveal";
import { HeroVideo } from "@/components/home/HeroVideo";

const counters = [
  { value: 3, label: "Ans d'expertise" },
  { value: 25, label: "Clients" },
  { value: 100, label: "Projets" },
];

/**
 * Home Hero — « Néon Subtil » (docs/design-spec.md › Section 2).
 * Server component; only the video, entrance animations and counters are client-side.
 * `data-under-navbar` lets it slide under the floating navbar (see app/(public)/layout.tsx).
 */
export function HeroSection() {
  return (
    <section
      id="hero"
      lang="fr"
      data-under-navbar
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-mnh-black text-mnh-text-white"
    >
      {/* Background video (z-0) */}
      <HeroVideo />

      {/* 1. Dark overlay — the bottom melts into #0A0A0A for a seamless next section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--mnh-black)_70%,transparent)_0%,color-mix(in_srgb,var(--mnh-black)_62%,transparent)_45%,color-mix(in_srgb,var(--mnh-black)_85%,transparent)_85%,var(--mnh-black)_100%)]"
      />
      {/* 2. Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,color-mix(in_srgb,var(--mnh-black)_60%,transparent)_100%)]"
      />
      {/* 3. Green glow (top right) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_20%,color-mix(in_srgb,var(--mnh-accent)_6%,transparent),transparent)]"
      />
      {/* 4. Dotted grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,color-mix(in_srgb,var(--mnh-white)_3%,transparent)_1px,transparent_1px)] bg-size-[32px_32px]"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 pt-[120px] pb-[120px] text-center sm:px-6 lg:pt-40">
        <HeroReveal delay={0}>
          <p className="inline-flex items-center gap-2 rounded-full border border-mnh-accent/20 bg-mnh-accent/8 px-4 py-1.5 font-sans text-[13px] font-medium tracking-[0.06em] text-mnh-accent uppercase backdrop-blur-sm">
            <span aria-hidden="true" className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mnh-accent opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-mnh-accent" />
            </span>
            Solutions Web, Mobile &amp; IA
          </p>
        </HeroReveal>

        <HeroReveal delay={0.15} fromOpacity={0.01}>
          <h1
            id="hero-heading"
            className="mt-8 max-w-[880px] font-heading text-[clamp(2.25rem,1.2rem+4.4vw,4rem)] leading-[1.1] font-bold tracking-[-0.02em] text-balance text-mnh-text-white"
          >
            Produits <span className="text-mnh-accent">digitaux</span> pensés pour des
            résultats business concrets
          </h1>
        </HeroReveal>

        <HeroReveal delay={0.35}>
          <p className="mx-auto mt-6 max-w-[640px] font-sans text-base leading-[1.7] text-pretty text-slate-300 sm:text-lg">
            Nous concevons, développons et optimisons des solutions web, mobile et IA pour
            attirer plus de clients, automatiser les opérations et accélérer la croissance.
          </p>
        </HeroReveal>

        <HeroReveal delay={0.45} className="mt-10 w-full sm:w-auto">
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:justify-center">
            <Link
              href="/services"
              className="group/cta inline-flex items-center justify-center gap-2 rounded-xl bg-mnh-accent px-7 py-3.5 font-sans text-[15px] font-semibold tracking-[0.01em] text-mnh-black transition-[background-color,translate,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-mnh-brand hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--mnh-accent)_25%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent motion-reduce:hover:translate-y-0"
            >
              Découvrir nos services
              <ArrowUpRight
                aria-hidden="true"
                size={16}
                className="transition-transform duration-300 ease-out group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 motion-reduce:transition-none"
              />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center rounded-xl border border-mnh-white/15 bg-transparent px-7 py-3.5 font-sans text-[15px] font-medium tracking-[0.01em] text-mnh-text-white backdrop-blur-sm transition-colors duration-300 ease-out hover:border-mnh-accent/40 hover:bg-mnh-accent/5 hover:text-mnh-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent"
            >
              Voir nos réalisations
            </Link>
          </div>
        </HeroReveal>

        <ul className="mt-20 flex items-center justify-center gap-5 sm:gap-12" aria-label="MNH Technologie en chiffres">
          {counters.map((counter, index) => (
            <li key={counter.label} className="flex items-center gap-5 sm:gap-12">
              {index > 0 && (
                <span aria-hidden="true" className="h-12 w-px bg-mnh-dark-border" />
              )}
              <HeroReveal delay={0.55 + index * 0.1}>
                <HeroCounter value={counter.value} label={counter.label} delay={0.55 + index * 0.1} />
              </HeroReveal>
            </li>
          ))}
        </ul>
      </div>

      {/* Scroll indicator (desktop) */}
      <a
        href="#after-hero"
        aria-label="Faire défiler vers la section suivante"
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 rounded-full p-1 text-mnh-text-muted-dark transition-colors duration-200 hover:text-mnh-text-white lg:flex"
      >
        <span aria-hidden="true" className="flex h-10 w-6 justify-center rounded-full border-2 border-current pt-2 opacity-70">
          <span className="h-2 w-1 animate-bounce rounded-full bg-current [animation-duration:2s] motion-reduce:animate-none" />
        </span>
      </a>
      <span id="after-hero" aria-hidden="true" className="absolute bottom-0" />
    </section>
  );
}
