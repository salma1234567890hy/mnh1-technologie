import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light";

type SectionHeaderProps = {
  /** Small uppercase label above the title (e.g. « POURQUOI NOUS »). */
  label: string;
  /** Full H2 text. */
  title: string;
  /** The ONE word (or short phrase) of `title` shown in green — first occurrence only. */
  highlight?: string;
  /** Optional paragraph under the title. */
  description?: ReactNode;
  /** Background the header sits on: picks a green and greys with AA contrast. */
  tone: Tone;
  align?: "left" | "center";
  /** id of the H2, to use with aria-labelledby on the parent <section>. */
  id?: string;
  className?: string;
};

/*
 * Contrast rule (CLAUDE.md): green TEXT is mnh-brand (#67B02E) on dark backgrounds
 * and mnh-brand-text (#3F7A1C) on light ones. The label's decorative line keeps
 * the official green in both tones (non-text element).
 */
const toneClasses: Record<Tone, { green: string; title: string; description: string }> = {
  dark: {
    green: "text-mnh-brand",
    title: "text-mnh-text-white",
    description: "text-mnh-text-muted-dark",
  },
  light: {
    green: "text-mnh-brand-text",
    title: "text-mnh-text-dark",
    description: "text-mnh-text-muted-light",
  },
};

/** Section heading — docs/design-spec.md › « En-tête de section » (label + H2 with one coloured word). */
export function SectionHeader({
  label,
  title,
  highlight,
  description,
  tone,
  align = "left",
  id,
  className,
}: SectionHeaderProps) {
  const colors = toneClasses[tone];
  const centered = align === "center";

  return (
    <div className={cn(centered && "mx-auto text-center", className)}>
      <p
        className={cn(
          "mb-4 flex items-center gap-3 font-sans text-xs leading-[1.4] font-semibold tracking-[0.08em] uppercase lg:text-sm",
          centered && "justify-center",
          colors.green,
        )}
      >
        <span aria-hidden="true" className="h-0.5 w-8 shrink-0 bg-mnh-brand" />
        {label}
      </p>
      <h2
        id={id}
        className={cn(
          "max-w-[650px] font-heading text-[1.75rem] leading-[1.15] font-bold tracking-[-0.015em] text-balance lg:text-5xl",
          centered && "mx-auto",
          colors.title,
        )}
      >
        <HighlightedTitle title={title} highlight={highlight} className={colors.green} />
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 max-w-[560px] font-sans text-[0.9375rem] leading-[1.7] lg:text-[1.0625rem]",
            centered && "mx-auto",
            colors.description,
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function HighlightedTitle({ title, highlight, className }: { title: string; highlight?: string; className: string }) {
  const index = highlight ? title.indexOf(highlight) : -1;
  if (!highlight || index === -1) return title;

  return (
    <>
      {title.slice(0, index)}
      <span className={className}>{highlight}</span>
      {title.slice(index + highlight.length)}
    </>
  );
}
