import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prefetchFor } from "@/components/layout/navigation";
import { RevealGroup, RevealItem } from "@/components/shared/RevealGroup";
import { Section } from "@/components/shared/Section";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { services } from "@/lib/content/services";
import { localizedHref } from "@/lib/i18n/config";
import { formatMessage } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";

const HEADING_ID = "services-heading";
const SERVICES_PAGE = "/services";

/**
 * Home › Services — docs/design-spec.md › Section 5 (white background).
 * Data: lib/content/services.ts (slugs, anchors, icons) + dict.services (names, descriptions).
 * Card hover AND keyboard focus (focus-within): green bar on the left, larger icon, arrow moving right.
 * Green TEXT on this light background is #3F7A1C (mnh-brand-text); #67B02E only for the bar and icons.
 */
export async function ServicesSection() {
  const { locale, dict } = await getDictionary();
  const t = dict.home.services;

  return (
    <Section tone="white" labelledBy={HEADING_ID}>
      <SectionHeader
        id={HEADING_ID}
        tone="light"
        label={t.label}
        title={t.title}
        highlight={t.highlight}
        action={
          <Link
            href={localizedHref(locale, SERVICES_PAGE)}
            prefetch={prefetchFor(SERVICES_PAGE)}
            className="group/all inline-flex items-center gap-2 rounded-[10px] border border-mnh-light-border px-6 py-3 font-sans text-sm font-semibold text-mnh-text-dark transition-colors duration-300 ease-out hover:border-mnh-brand hover:text-mnh-brand-text"
          >
            {t.cta}
            <ArrowRight
              aria-hidden="true"
              size={16}
              className="transition-transform duration-300 ease-out group-hover/all:translate-x-0.5 motion-reduce:transition-none"
            />
          </Link>
        }
      />

      <RevealGroup as="ul" className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-16">
        {services.map((service, index) => {
          const Icon = service.icon;
          const { name, description } = dict.services[service.slug];
          return (
            <RevealItem key={service.slug} as="li" className="flex">
              <article
                className={[
                  "group/card relative isolate flex w-full flex-col overflow-hidden rounded-[20px] border border-mnh-light-border bg-mnh-light p-8 lg:p-10",
                  "transition-[background-color,border-color,box-shadow] duration-[350ms] ease-out",
                  "hover:border-transparent hover:bg-mnh-white hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)]",
                  "focus-within:border-transparent focus-within:bg-mnh-white focus-within:shadow-[0_20px_60px_rgba(0,0,0,0.06)]",
                  // 3px green bar on the left edge (scaleY 0 → 1, from the top).
                  "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:origin-top before:scale-y-0 before:bg-mnh-brand before:transition-transform before:duration-[350ms] before:ease-out",
                  "hover:before:scale-y-100 focus-within:before:scale-y-100 motion-reduce:before:transition-none",
                ].join(" ")}
              >
                {/* Discreet number (texture only). */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-2 right-4 -z-10 font-heading text-[64px] leading-none font-bold text-black/[0.03] select-none"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span
                  aria-hidden="true"
                  className="flex size-[52px] items-center justify-center rounded-[14px] bg-mnh-brand/8 text-mnh-brand transition-transform duration-[350ms] ease-out group-hover/card:scale-105 group-focus-within/card:scale-105 motion-reduce:transition-none motion-reduce:group-hover/card:scale-100 motion-reduce:group-focus-within/card:scale-100"
                >
                  <Icon size={24} strokeWidth={1.5} />
                </span>

                <h3 className="mt-6 font-heading text-xl leading-[1.3] font-semibold tracking-[-0.01em] text-mnh-text-dark lg:text-2xl">
                  {name}
                </h3>
                <p className="mt-3 font-sans text-[15px] leading-[1.7] text-mnh-text-muted-light">{description}</p>

                {/* mt-auto: links aligned at the bottom when cards in a row have different heights. */}
                <div className="mt-auto pt-6">
                  <Link
                    href={localizedHref(locale, service.href)}
                    prefetch={prefetchFor(service.href)}
                    aria-label={formatMessage(t.learnMoreLabel, { name })}
                    className="inline-flex items-center gap-2 rounded-sm font-sans text-sm font-semibold text-mnh-brand-text transition-[gap] duration-300 ease-out group-hover/card:gap-3 group-focus-within/card:gap-3 motion-reduce:transition-none"
                  >
                    {t.learnMore}
                    <ArrowRight aria-hidden="true" size={16} />
                  </Link>
                </div>
              </article>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Section>
  );
}
