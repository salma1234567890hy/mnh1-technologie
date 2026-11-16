import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "dark" | "light";

type SectionHeaderProps = {
  /** Small uppercase label above the title (e.g. « Nos services »). */
  label: string;
  /** Full H2 text. */
  title: string;
  /** The ONE word (or short phrase) of `title` shown in colour — first occurrence only. */
  highlight?: string;
  /** Optional paragraph under the title. */
  description?: ReactNode;
  /** Background the header sits on: picks greens and greys with AA contrast. */
  tone: Tone;
  align?: "left" | "center";
  /** Optional button or link: on the right on desktop (lg), below the title on mobile. */
  action?: ReactNode;
  /** id of the H2, to use with aria-labelledby on the parent <section>. */
  id?: string;
  className?: string;
};

/*
 * Colours (CLAUDE.md › contrast rule, FE-03 decisions):
 * - dark background:  label #67B02E (mnh-brand) · coloured word #4ADE80 (mnh-accent, like the Hero H1)
 * - light background: label AND coloured word #3F7A1C (mnh-brand-text) — #67B02E is never text on light.
 * The label's decorative line keeps the official green #67B02E in both tones (non-text element).
 */
const toneClasses: Record<Tone, { label: string; highlight: string; title: string; description: string }> = {
  dark: {
    label: "text-mnh-brand",
    highlight: "text-mnh-accent",
    title: "text-mnh-text-white",
    description: "text-mnh-text-muted-dark",
  },
  light: {
    label: "text-mnh-brand-text",
    highlight: "text-mnh-brand-text",
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
  action,
  id,
  className,
}: SectionHeaderProps) {
  const colors = toneClasses[tone];
  const centered = align === "center";

  const heading = (
    <div className={cn(centered && "mx-auto text-center")}>
      <p
        className={cn(
          "mb-4 flex items-center gap-3 font-sans text-xs leading-[1.4] font-semibold tracking-[0.08em] uppercase lg:text-sm",
          centered && "justify-center",
          colors.label,
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
        <HighlightedText text={title} highlight={highlight} className={colors.highlight} />
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

  if (!action) return <div className={className}>{heading}</div>;

  return (
    <div className={cn("flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between", className)}>
      {heading}
      <div className="shrink-0">{action}</div>
    </div>
  );
}

/** `text` with the first occurrence of `highlight` wrapped in a coloured span (one accent per title). */
export function HighlightedText({ text, highlight, className }: { text: string; highlight?: string; className: string }) {
  const index = highlight ? text.indexOf(highlight) : -1;
  if (!highlight || index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <span className={className}>{highlight}</span>
      {text.slice(index + highlight.length)}
    </>
  );
}
