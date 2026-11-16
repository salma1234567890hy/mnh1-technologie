"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Container } from "@/components/shared/Container";

/** Runtime error fallback for every route below the root layout. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      lang="fr"
      className="flex flex-1 items-center bg-mnh-black py-[72px] text-mnh-text-white md:py-24 lg:py-[120px]"
    >
      <Container className="text-center">
        <p className="font-sans text-xs font-semibold tracking-[0.08em] text-mnh-brand uppercase lg:text-sm">
          Erreur
        </p>
        <h1 className="mx-auto mt-4 max-w-[640px] font-heading text-[2.25rem] leading-[1.1] font-bold tracking-[-0.02em] text-balance lg:text-6xl">
          Une erreur est <span className="text-mnh-accent">survenue</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[520px] font-sans text-[0.9375rem] leading-[1.7] text-mnh-text-muted-dark lg:text-[1.0625rem]">
          Un problème inattendu empêche l&apos;affichage de cette page. Vous pouvez réessayer.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="group/cta inline-flex items-center justify-center gap-2 rounded-xl bg-mnh-accent px-7 py-3.5 font-sans text-[15px] font-semibold tracking-[0.01em] text-mnh-black transition-[background-color,box-shadow] duration-300 ease-out hover:bg-mnh-brand hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--mnh-accent)_25%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent"
          >
            <RotateCcw
              aria-hidden="true"
              size={16}
              className="transition-transform duration-300 ease-out group-hover/cta:-rotate-45 motion-reduce:transition-none"
            />
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-mnh-white/15 px-7 py-3.5 font-sans text-[15px] font-medium tracking-[0.01em] text-mnh-text-white transition-colors duration-300 ease-out hover:border-mnh-accent/40 hover:bg-mnh-accent/5 hover:text-mnh-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </Container>
    </main>
  );
}
