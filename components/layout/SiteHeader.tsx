"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HeaderCta } from "@/components/layout/HeaderCta";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { isActivePath, mainNavigationLinks } from "@/components/layout/navigation";
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
          <Link
            href="/"
            aria-label="MNH Technologie — Home"
            className="inline-flex shrink-0 items-center rounded-md"
          >
            <Image
              src="/brand/mnh-logo-white.png"
              alt=""
              width={36}
              height={36}
              preload
              className="size-7 object-contain xl:size-9"
            />
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden min-w-0 flex-1 justify-center xl:flex"
          >
            <Suspense fallback={<DesktopNavLinks pathname={null} />}>
              <DesktopNavLinksWithPathname />
            </Suspense>
          </nav>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <LanguageSwitcher sideOffset={24} />
            <SearchTrigger shortcut="always" />
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
  return (
    <ul className="flex items-center gap-6 2xl:gap-8">
      {mainNavigationLinks.map((link) => {
        const isActive = pathname !== null && isActivePath(pathname, link.href);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative inline-flex items-center rounded-sm py-2 font-sans text-[15px] font-medium whitespace-nowrap transition-colors duration-200 ease-out",
                "after:absolute after:bottom-0 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-mnh-accent after:transition-opacity after:duration-200",
                isActive
                  ? "text-mnh-accent after:opacity-100"
                  : "text-mnh-text-muted-dark after:opacity-0 hover:text-mnh-text-white",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
