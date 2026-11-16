import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/shared/Container";

export type SectionTone = "dark" | "light" | "white";

/** Backgrounds of docs/design-spec.md › Récapitulatif du rythme visuel. */
const toneClasses: Record<SectionTone, string> = {
  dark: "bg-mnh-black text-mnh-text-white", // #0A0A0A
  light: "bg-mnh-light text-mnh-text-dark", // #F9FAFB
  white: "bg-mnh-white text-mnh-text-dark", // #FFFFFF
};

type SectionProps = {
  tone: SectionTone;
  /** id of the section's H2 (aria-labelledby). */
  labelledBy: string;
  /** Optional id of the section itself (anchor). */
  id?: string;
  /** Decorative layers rendered behind the content (absolutely positioned, aria-hidden by the caller). */
  background?: ReactNode;
  className?: string;
  /** Extra classes for the inner Container (e.g. a narrower max-width). */
  containerClassName?: string;
  children: ReactNode;
};

/**
 * Home page section — vertical spacing of the spec (120px desktop / 96px tablet / 72px mobile),
 * background by tone, 1280px Container, labelled by its H2.
 */
export function Section({ tone, labelledBy, id, background, className, containerClassName, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative py-[72px] md:py-24 lg:py-[120px]", toneClasses[tone], background && "isolate overflow-hidden", className)}
    >
      {background}
      <Container className={cn("relative", containerClassName)}>{children}</Container>
    </section>
  );
}
