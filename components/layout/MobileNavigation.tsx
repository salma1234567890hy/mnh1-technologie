"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { HeaderCta } from "@/components/layout/HeaderCta";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { isActivePath, mainNavigationLinks } from "@/components/layout/navigation";

const PANEL_ID = "mobile-navigation-panel";

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  // Close the panel if the viewport grows to the desktop layout (xl, 1280px).
  useEffect(() => {
    if (!isOpen) return;
    const desktop = window.matchMedia("(min-width: 80rem)");
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) setIsOpen(false);
    }
    desktop.addEventListener("change", handleChange);
    return () => desktop.removeEventListener("change", handleChange);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        aria-label="Open navigation menu"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-mnh-dark-border text-mnh-text-white transition-colors duration-200 ease-out hover:border-mnh-accent/40 hover:text-mnh-accent xl:hidden"
      >
        <Menu aria-hidden="true" size={18} />
      </DialogTrigger>

      <DialogPortal>
        <DialogOverlay className="z-50 bg-mnh-black/50 backdrop-blur-none duration-300 supports-backdrop-filter:backdrop-blur-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 xl:hidden" />
        {/* Floating panel: 12px from the edges, radius 16px, slides in from the right. */}
        <DialogPrimitive.Popup
          id={PANEL_ID}
          className="fixed inset-y-3 right-3 z-50 flex w-[min(22rem,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-mnh-white/8 bg-mnh-dark-elevated text-mnh-text-white shadow-[0_8px_32px_color-mix(in_srgb,var(--mnh-black)_25%,transparent)] outline-none transition-transform duration-300 ease-out data-ending-style:translate-x-[calc(100%+12px)] data-starting-style:translate-x-[calc(100%+12px)] motion-reduce:transition-none xl:hidden"
        >
          <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-mnh-dark-border pr-2 pl-3">
            <Image
              src="/brand/mnh-logo-white.png"
              alt=""
              width={28}
              height={28}
              className="size-7 object-contain"
            />
            <DialogTitle className="sr-only">Navigation menu</DialogTitle>
            <DialogClose
              aria-label="Close navigation menu"
              className="inline-flex size-10 items-center justify-center rounded-full border border-mnh-dark-border text-mnh-text-white transition-colors duration-200 ease-out hover:border-mnh-accent/40 hover:text-mnh-accent"
            >
              <X aria-hidden="true" size={18} />
            </DialogClose>
          </div>

          <nav
            aria-label="Main navigation"
            className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
          >
            <Suspense fallback={<MobileNavLinks pathname={null} onNavigate={closeMenu} />}>
              <MobileNavLinksWithPathname onNavigate={closeMenu} />
            </Suspense>
          </nav>

          <div className="flex shrink-0 flex-col gap-3 border-t border-mnh-dark-border px-4 py-6 sm:px-6">
            <LanguageSwitcher fullWidth />
            <HeaderCta onClick={closeMenu} className="w-full" />
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}

type MobileNavLinksProps = {
  onNavigate: () => void;
};

function MobileNavLinksWithPathname({ onNavigate }: MobileNavLinksProps) {
  const pathname = usePathname();
  return <MobileNavLinks pathname={pathname} onNavigate={onNavigate} />;
}

function MobileNavLinks({
  pathname,
  onNavigate,
}: MobileNavLinksProps & { pathname: string | null }) {
  return (
    <ul className="flex flex-col gap-1">
      {mainNavigationLinks.map((link) => {
        const isActive = pathname !== null && isActivePath(pathname, link.href);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 font-sans text-xl font-medium transition-colors duration-200 ease-out",
                isActive
                  ? "text-mnh-accent"
                  : "text-mnh-text-muted-dark hover:bg-mnh-white/5 hover:text-mnh-text-white",
              )}
            >
              {link.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="size-1 rounded-full bg-mnh-accent"
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
