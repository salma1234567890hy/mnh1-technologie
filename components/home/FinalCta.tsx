import Link from "next/link";
import { prefetchFor } from "@/components/layout/navigation";
import { Reveal } from "@/components/shared/Reveal";
import { Section } from "@/components/shared/Section";
import { HighlightedText } from "@/components/shared/SectionHeader";
import { localizedHref } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const HEADING_ID = "final-cta-heading";
const CONTACT_PAGE = "/contact";

/**
 * Home › Final CTA — docs/design-spec.md › Section 10 (dark background, green glow, two discreet lines).
 * Title, then the button 0.2s later. Kept together with the footer "Start a project" form (FE-03 decision).
 */
export async function FinalCta() {
  const { locale, dict } = await getDictionary();
  const t = dict.home.finalCta;

  return (
    <Section
      tone="dark"
      labelledBy={HEADING_ID}
      containerClassName="flex max-w-3xl flex-col items-center text-center"
      background={
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_80%_at_50%_50%,color-mix(in_srgb,var(--mnh-brand)_8%,transparent),transparent)]"
        />
      }
    >
      <span aria-hidden="true" className="h-px w-2/5 bg-mnh-brand/15" />

      <Reveal className="mt-12 lg:mt-16">
        <h2
          id={HEADING_ID}
          className="font-heading text-[1.75rem] leading-[1.2] font-bold tracking-[-0.015em] text-balance text-mnh-text-white lg:text-5xl"
        >
          <HighlightedText text={t.title} highlight={t.highlight} className="text-mnh-accent" />
        </h2>
      </Reveal>

      <Reveal delay={0.2} className="mt-10">
        <Link
          href={localizedHref(locale, CONTACT_PAGE)}
          prefetch={prefetchFor(CONTACT_PAGE)}
          className="inline-flex items-center justify-center rounded-xl bg-mnh-accent px-10 py-[18px] font-sans text-base font-semibold text-mnh-black transition-[background-color,translate,box-shadow] duration-300 ease-out hover:-translate-y-0.5 hover:bg-mnh-brand hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--mnh-accent)_30%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mnh-accent motion-reduce:hover:translate-y-0"
        >
          {t.button}
        </Link>
      </Reveal>

      <span aria-hidden="true" className="mt-12 h-px w-2/5 bg-mnh-brand/15 lg:mt-16" />
    </Section>
  );
}
