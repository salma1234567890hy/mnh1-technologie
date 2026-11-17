import Link from "next/link";
import { cacheLife } from "next/cache";
import { BackToTop } from "@/components/layout/footer/BackToTop";
import { BrandLockup } from "@/components/shared/BrandLockup";
import { FooterLink } from "@/components/layout/footer/FooterLink";
import { FooterPageLinks } from "@/components/layout/footer/FooterPageLinks";
import { FooterWordmark } from "@/components/layout/footer/FooterWordmark";
import { StartProjectForm } from "@/components/layout/footer/StartProjectForm";
import { StudioStatus } from "@/components/layout/footer/StudioStatus";
import { FOOTER_EXCLUDED_PAGES, footerConfig } from "@/components/layout/footer/footer-config";
import { mainNavigation, prefetchFor } from "@/components/layout/navigation";
import { services } from "@/lib/content/services";
import { localizedHref } from "@/lib/i18n/config";
import { formatMessage } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";

/** Current year, cached for a day (new Date() can't run in the prerendered shell with cacheComponents). */
async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const labelClass =
  "mb-3 font-sans text-[11px] font-semibold tracking-[0.12em] text-mnh-text-muted-dark uppercase";

/**
 * Site footer — floating card (docs/design-spec.md › Section 11).
 * Server component; interactive parts are small client islands.
 */
export async function SiteFooter() {
  const year = await getCurrentYear();
  const { locale, dict } = await getDictionary();
  const t = dict.footer;
  const { company, contact, hours, social, legal } = footerConfig;
  const pageLinks = mainNavigation
    .filter((link) => !FOOTER_EXCLUDED_PAGES.includes(link.href))
    .map((link) => ({ href: link.href, label: dict.nav.items[link.key].label }));

  return (
    <footer className="bg-mnh-black px-3 pb-3 lg:px-6 lg:pb-6">
      <div className="relative isolate mx-auto max-w-[1440px] rounded-3xl border border-mnh-white/8 bg-mnh-dark-elevated p-8 font-sans text-[13px] leading-[1.6] text-mnh-text-muted-dark sm:text-sm lg:rounded-[32px] lg:p-12">
        {/* Discreet glow behind the signature */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[radial-gradient(ellipse_60%_45%_at_50%_100%,color-mix(in_srgb,var(--mnh-brand)_8%,transparent),transparent)]"
        />

        {/*
          ── Metadata columns ─────────────────────────────
          lg: 3fr / 4fr / 3fr / auto — the first column ("Studio") never gets narrower than the
          brand lockup (icon + company name, ~179px: minmax(min-content,3fr), needed around 1024px);
          the last column ("Say hello") sizes to the email,
          so it stays on one line without spilling into "Explore" (a 2/12 column is
          only ~150px at 1280px, the email needs ~218px).
        */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-[minmax(min-content,3fr)_4fr_3fr_auto] xl:gap-12">
          {/* 1. Studio */}
          <section aria-labelledby="footer-studio" className="min-w-0">
            <h2 id="footer-studio" className={labelClass}>{t.columns.studio}</h2>
            {/* Icon + company name (same lockup as the navbar); the link is named once by aria-label. */}
            <Link
              href={localizedHref(locale, "/")}
              aria-label={dict.common.homeLink}
              className="inline-flex rounded-md"
            >
              <BrandLockup size="footer" />
            </Link>
            <p className="mt-4 tabular-nums">
              © {year} {company.displayName}
            </p>
            <div className="mt-4 space-y-1">
              <StudioStatus hours={hours} openText={t.status.open} closedText={t.status.closed} />
              <p className="tabular-nums">{t.hours}</p>
            </div>
            {/* Postal address: always in French (footer-config), so lang="fr" in every language. */}
            <address lang="fr" className="mt-4 not-italic">
              <a
                href={contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={formatMessage(t.mapsLabel, { address: contact.address.join(", ") })}
                className="inline-block rounded-sm transition-colors duration-200 hover:text-mnh-text-white"
              >
                {contact.address.map((line) => (
                  <span key={line} className="block tabular-nums">{line}</span>
                ))}
              </a>
            </address>
          </section>

          {/* 2. Start a project */}
          <section aria-labelledby="footer-start" className="min-w-0">
            <h2 id="footer-start" className={labelClass}>{t.columns.startProject}</h2>
            <h3 className="font-heading text-[22px] leading-[1.3] font-semibold text-mnh-text-white">
              {t.startProject.title}
            </h3>
            <p className="mt-2">{t.startProject.text}</p>
            <StartProjectForm
              emailLabel={t.startProject.emailLabel}
              placeholder={t.startProject.placeholder}
              submitLabel={t.startProject.submitLabel}
              errorMessage={t.startProject.error}
              destination={localizedHref(locale, footerConfig.startProjectDestination)}
            />
          </section>

          {/* 3. Explore */}
          <section aria-labelledby="footer-explore" className="min-w-0">
            <h2 id="footer-explore" className={labelClass}>{t.columns.explore}</h2>
            <div className="grid grid-cols-2 gap-6">
              <nav aria-label={t.pagesNavLabel}>
                <FooterPageLinks links={pageLinks} />
              </nav>
              <nav aria-label={t.servicesNavLabel}>
                <ul className="space-y-2">
                  {services.map((service) => (
                    <li key={service.slug}>
                      <FooterLink href={localizedHref(locale, service.href)}>{dict.services[service.slug].name}</FooterLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </section>

          {/* 4. Say hello */}
          <section aria-labelledby="footer-hello" className="min-w-0 lg:text-right">
            <h2 id="footer-hello" className={labelClass}>{t.columns.sayHello}</h2>
            <ul className="space-y-2 lg:flex lg:flex-col lg:items-end">
              <li>
                <FooterLink href={`mailto:${contact.email}`} className="whitespace-nowrap">
                  {contact.email}
                </FooterLink>
              </li>
              <li>
                <FooterLink href={contact.phone.href} className="tabular-nums whitespace-nowrap">
                  {contact.phone.display}
                </FooterLink>
              </li>
              {social.map((network) => (
                <li key={network.name}>
                  <FooterLink href={network.href} external ariaLabel={t.social[network.labelKey]}>
                    {network.name}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ── Giant signature ────────────────────────────── */}
        <div
          aria-hidden="true"
          className="mt-16 h-px bg-linear-to-r from-transparent via-mnh-brand/30 to-transparent"
        />
        <div className="pt-8">
          <FooterWordmark label={company.displayName} />
        </div>

        {/* ── Bottom line ────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 text-xs text-mnh-text-muted-dark">
          <p lang="fr" className="tracking-[0.2em] uppercase">{company.tagline}</p>
          <div className="flex items-center gap-6">
            <nav aria-label={t.legalNavLabel}>
              <ul className="flex items-center gap-4">
                {legal.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={localizedHref(locale, item.href)}
                      prefetch={prefetchFor(item.href)}
                      className="rounded-sm transition-colors duration-200 hover:text-mnh-text-white"
                    >
                      {t.legal[item.key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <BackToTop label={t.backToTop} />
          </div>
        </div>
      </div>
    </footer>
  );
}
