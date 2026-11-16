import type { ReactNode } from "react";
import { Container } from "@/components/shared/Container";

type StatusScreenProps = {
  /** Small green label above the title (e.g. "Erreur 404"). */
  label: string;
  /** Title split around its ONE coloured word (charte: one accent per title). */
  title: { before: string; highlight: string; after: string };
  text: string;
  /** Actions (links / buttons). */
  children: ReactNode;
  /** Render as <main id="main"> (true) or as a plain block inside an existing <main> (false). */
  asMain?: boolean;
};

/** Full-height dark screen for 404 and error pages (public site and Admin). Texts come from the caller. */
export function StatusScreen({ label, title, text, children, asMain = true }: StatusScreenProps) {
  const Wrapper = asMain ? "main" : "div";
  return (
    <Wrapper
      {...(asMain ? { id: "main" } : {})}
      className="flex flex-1 items-center bg-mnh-black py-[72px] text-mnh-text-white md:py-24 lg:py-[120px]"
    >
      <Container className="text-center">
        <p className="font-sans text-xs font-semibold tracking-[0.08em] text-mnh-brand uppercase lg:text-sm">{label}</p>
        <h1 className="mx-auto mt-4 max-w-[640px] font-heading text-[2.25rem] leading-[1.1] font-bold tracking-[-0.02em] text-balance lg:text-6xl">
          {title.before}
          <span className="text-mnh-accent">{title.highlight}</span>
          {title.after}
        </h1>
        <p className="mx-auto mt-6 max-w-[520px] font-sans text-[0.9375rem] leading-[1.7] text-mnh-text-muted-dark lg:text-[1.0625rem]">
          {text}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">{children}</div>
      </Container>
    </Wrapper>
  );
}

/** Primary action style (same as the Hero CTA). */
export const statusPrimaryActionClass =
  "group/cta inline-flex items-center justify-center gap-2 rounded-xl bg-mnh-accent px-7 py-3.5 font-sans text-[15px] font-semibold tracking-[0.01em] text-mnh-black transition-[background-color,box-shadow] duration-300 ease-out hover:bg-mnh-brand hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--mnh-accent)_25%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent";

/** Secondary action style (outlined, same as the Hero secondary CTA). */
export const statusSecondaryActionClass =
  "inline-flex items-center justify-center rounded-xl border border-mnh-white/15 px-7 py-3.5 font-sans text-[15px] font-medium tracking-[0.01em] text-mnh-text-white transition-colors duration-300 ease-out hover:border-mnh-accent/40 hover:bg-mnh-accent/5 hover:text-mnh-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent";
