import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/shared/Container";

export const metadata: Metadata = {
  title: "Page introuvable",
};

/** Global 404 (unmatched URLs and notFound()). Rendered inside the root layout only. */
export default function NotFound() {
  return (
    <main
      id="main"
      lang="fr"
      className="flex flex-1 items-center bg-mnh-black py-[72px] text-mnh-text-white md:py-24 lg:py-[120px]"
    >
      <Container className="text-center">
        <p className="font-sans text-xs font-semibold tracking-[0.08em] text-mnh-brand uppercase lg:text-sm">
          Erreur 404
        </p>
        <h1 className="mx-auto mt-4 max-w-[640px] font-heading text-[2.25rem] leading-[1.1] font-bold tracking-[-0.02em] text-balance lg:text-6xl">
          Page <span className="text-mnh-accent">introuvable</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[520px] font-sans text-[0.9375rem] leading-[1.7] text-mnh-text-muted-dark lg:text-[1.0625rem]">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="group/cta mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-mnh-accent px-7 py-3.5 font-sans text-[15px] font-semibold tracking-[0.01em] text-mnh-black transition-[background-color,box-shadow] duration-300 ease-out hover:bg-mnh-brand hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--mnh-accent)_25%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent"
        >
          <ArrowLeft
            aria-hidden="true"
            size={16}
            className="transition-transform duration-300 ease-out group-hover/cta:-translate-x-0.5 motion-reduce:transition-none"
          />
          Retour à l&apos;accueil
        </Link>
      </Container>
    </main>
  );
}
