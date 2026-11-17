"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { localizedHref } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n/I18nProvider";
import { HeaderCta } from "@/components/layout/HeaderCta";
import { BrandLockup } from "@/components/shared/BrandLockup";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { isActivePath, mainNavigation, prefetchFor } from "@/components/layout/navigation";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { SiteSearchProvider } from "@/components/search/SiteSearch";

/** Scroll distance (px) after which the floating bar rises and gets more opaque. */
const SCROLL_THRESHOLD = 80;

/*
 * Floating bar (see docs/design-spec.md §1):
 * - < xl : top 12px, 12px from the edges, 60px high, radius 14px
 * - ≥ xl : top 24px (12px once scrolled), 32px from the edges, max 1280px, 70px high, radius 16px
 * Content below is offset with --navbar-offset (see app/(public)/layout.tsx).
 */
export function SiteHeader() {
  const isScrolled = useIsScrolled(SCROLL_THRESHOLD);
  const { dict, locale } = useI18n();

  return (
    <SiteSearchProvider>
      <header
        className={cn(
          "fixed top-3 left-1/2 z-50 w-[calc(100%-24px)] max-w-7xl -translate-x-1/2 xl:top-6 xl:w-[calc(100%-64px)]",
          "transition-[translate] duration-400 ease-out motion-reduce:transition-none",
          isScrolled && "xl:-translate-y-3",
        )}
      >
        <div
          className={cn(
            "relative flex h-[60px] items-center justify-between gap-4 rounded-[14px] border border-mnh-white/8 pr-2 pl-3 xl:h-[70px] xl:rounded-2xl",
            "shadow-[0_8px_32px_color-mix(in_srgb,var(--mnh-black)_25%,transparent)] backdrop-blur-[16px] backdrop-saturate-[180%]",
            "transition-[background-color] duration-400 ease-out motion-reduce:transition-none",
            isScrolled ? "bg-mnh-dark-elevated/92" : "bg-mnh-dark-elevated/85",
          )}
        >
          {/*
            Logo + company name. The link's accessible name comes from aria-label only
            (the visible name is aria-hidden, so it is never read twice).
            Name visibility: hidden < 360px · shown from 360px at every width (FE-02 fix: also 1280–1439px,
            made possible by the round search button and the 20px link gap at 1280–1439px — measured in
            headless Chrome: ≥ 69px of free space at 1280px in FR, 88px in EN, name never truncated).
            The link may shrink (min-w-0) and the name truncates, so it can never push the bar
            into overflowing or wrapping; the nav keeps its natural width (min-w-fit).
          */}
          <Link
            href={localizedHref(locale, "/")}
            aria-label={dict.common.homeLink}
            className="inline-flex min-w-0 items-center rounded-md"
          >
            <BrandLockup size="navbar" preload />
          </Link>

          <nav
            aria-label={dict.nav.mainLabel}
            className="hidden min-w-fit flex-1 justify-center xl:flex"
          >
            <Suspense fallback={<DesktopNavLinks pathname={null} />}>
              <DesktopNavLinksWithPathname />
            </Suspense>
          </nav>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <LanguageSwitcher sideOffset={24} />
            {/* Round magnifier at 1280–1439px (space for the company name), "Ctrl K" pill from 1440px. */}
            <SearchTrigger shortcut="wide" />
            <HeaderCta className="ml-2" />
          </div>

          {/* Mobile / tablet actions */}
          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            <SearchTrigger />
            <MobileNavigation />
          </div>

          {/* Discreet green glow line along the bottom edge */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[20%] bottom-0 h-px bg-linear-to-r from-transparent via-mnh-brand/30 to-transparent"
          />
        </div>
      </header>
    </SiteSearchProvider>
  );
}

function useIsScrolled(threshold: number) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function update() {
      setIsScrolled(window.scrollY > threshold);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return isScrolled;
}

function DesktopNavLinksWithPathname() {
  const pathname = usePathname();
  return <DesktopNavLinks pathname={pathname} />;
}

function DesktopNavLinks({ pathname }: { pathname: string | null }) {
  const { dict, locale } = useI18n();
  return (
    // 20px at 1280–1439px, 24px from 1440px (no 32px at 2xl): leaves room for the company name.
    <ul className="flex items-center gap-5 min-[90rem]:gap-6">
      {mainNavigation.map((link) => {
        const isActive = pathname !== null && isActivePath(pathname, link.href);

        return (
          <li key={link.href}>
            <Link
              href={localizedHref(locale, link.href)}
              prefetch={prefetchFor(link.href)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center rounded-sm py-2 font-sans text-[15px] font-medium whitespace-nowrap transition-colors duration-200 ease-out",
                "after:absolute after:bottom-0 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-mnh-accent after:transition-opacity after:duration-200",
                isActive
                  ? "text-mnh-accent after:opacity-100"
                  : "text-mnh-text-muted-dark after:opacity-0 hover:text-mnh-text-white",
              )}
            >
              {dict.nav.items[link.key].label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
