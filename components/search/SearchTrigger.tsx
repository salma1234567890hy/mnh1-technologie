"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useSiteSearch } from "@/components/search/SiteSearch";

type ShortcutDisplay = "never" | "always" | "2xl";

type SearchTriggerProps = {
  /**
   * Where the "⌘K" badge is shown. With the badge the button is a pill
   * (radius 12px); without it, a 40×40 circle.
   */
  shortcut?: ShortcutDisplay;
  className?: string;
};

const buttonShape: Record<ShortcutDisplay, string> = {
  never: "w-10 rounded-full",
  always: "rounded-xl pr-1.5 pl-3",
  "2xl": "w-10 rounded-full 2xl:w-auto 2xl:rounded-xl 2xl:pr-1.5 2xl:pl-3",
};

const badgeVisibility: Record<ShortcutDisplay, string> = {
  never: "hidden",
  always: "inline-flex",
  "2xl": "hidden 2xl:inline-flex",
};

const noopSubscribe = () => () => {};

/** Client-only platform check; the server snapshot keeps hydration stable. */
function useIsApplePlatform() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

export function SearchTrigger({ shortcut = "never", className }: SearchTriggerProps) {
  const { isOpen, openSearch, registerTrigger } = useSiteSearch();
  const isApple = useIsApplePlatform();
  const { dict } = useI18n();

  return (
    <button
      ref={registerTrigger}
      type="button"
      onClick={openSearch}
      aria-label={dict.search.trigger}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-keyshortcuts={isApple ? "Meta+K /" : "Control+K /"}
      className={cn(
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 border border-mnh-dark-border text-mnh-text-muted-dark transition-colors duration-200 ease-out hover:border-mnh-accent/40 hover:text-mnh-accent",
        buttonShape[shortcut],
        className,
      )}
    >
      <Search aria-hidden="true" size={18} />
      {shortcut !== "never" && (
        <kbd
          aria-hidden="true"
          className={cn(
            "h-6 items-center rounded-md border border-mnh-dark-border px-1.5 font-sans text-xs whitespace-nowrap text-mnh-text-muted-dark",
            badgeVisibility[shortcut],
          )}
        >
          {isApple ? "⌘K" : "Ctrl K"}
        </kbd>
      )}
    </button>
  );
}
