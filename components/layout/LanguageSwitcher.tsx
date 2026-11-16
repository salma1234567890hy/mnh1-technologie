"use client";

import { usePathname } from "next/navigation";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/components/i18n/I18nProvider";
import { LOCALE_LABELS, LOCALES, languageSwitchHref } from "@/lib/i18n/config";
import { formatMessage } from "@/lib/i18n/format";

type LanguageSwitcherProps = {
  /** Full-width variant used inside the mobile panel. */
  fullWidth?: boolean;
  /** Distance between the trigger and the menu (24px opens it just below the 70px bar). */
  sideOffset?: number;
  className?: string;
};

/**
 * Language menu: each option is a REAL link (<a href>) to the same page in the other language,
 * through GET /language, which sets the mnh_lang cookie server-side and redirects (303).
 * Switching therefore needs no JavaScript handler. Plain <a> on purpose (no Next <Link>):
 * a prefetch of /language would set the cookie without the user choosing.
 */
export function LanguageSwitcher({ fullWidth = false, sideOffset = 8, className }: LanguageSwitcherProps) {
  const { dict, locale } = useI18n();
  const current = LOCALE_LABELS[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // The visible "FR" / "EN" is part of the accessible name (WCAG 2.5.3).
        aria-label={formatMessage(dict.language.trigger, { name: current.name, short: current.short })}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-lg font-sans text-[15px] font-medium text-mnh-text-muted-dark transition-colors duration-200 ease-out hover:text-mnh-text-white data-popup-open:text-mnh-text-white",
          fullWidth
            ? "h-[46px] w-full justify-between rounded-xl border border-mnh-dark-border px-4"
            : "h-10 px-2.5",
          className,
        )}
      >
        <span>{current.short}</span>
        <ChevronDown
          aria-hidden="true"
          size={16}
          className="transition-transform duration-200 group-data-popup-open:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={sideOffset}
        className="min-w-40 rounded-xl border border-mnh-white/8 bg-mnh-dark-elevated p-1 text-mnh-text-white shadow-[0_8px_32px_color-mix(in_srgb,var(--mnh-black)_25%,transparent)] ring-0"
      >
        <LanguageLinks />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Rendered only while the menu is open (client side), so usePathname needs no Suspense here. */
function LanguageLinks() {
  const { locale } = useI18n();
  const pathname = usePathname();

  return LOCALES.map((target) => {
    const isCurrent = target === locale;
    return (
      <MenuPrimitive.LinkItem
        key={target}
        href={languageSwitchHref(target, pathname)}
        hrefLang={target}
        lang={target}
        aria-current={isCurrent ? "true" : undefined}
        className={cn(
          "flex cursor-default items-center rounded-md px-2.5 py-2 font-sans text-sm outline-hidden select-none",
          "data-highlighted:bg-mnh-dark-border focus:bg-mnh-dark-border",
          isCurrent
            ? "text-mnh-accent"
            : "text-mnh-text-muted-dark data-highlighted:text-mnh-text-white focus:text-mnh-text-white",
        )}
      >
        {LOCALE_LABELS[target].name}
      </MenuPrimitive.LinkItem>
    );
  });
}
