"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { defaultLanguage, languages } from "@/components/layout/navigation";

type LanguageSwitcherProps = {
  /** Full-width variant used inside the mobile panel. */
  fullWidth?: boolean;
  /** Distance between the trigger and the menu (24px opens it just below the 70px bar). */
  sideOffset?: number;
  className?: string;
};

export function LanguageSwitcher({
  fullWidth = false,
  sideOffset = 8,
  className,
}: LanguageSwitcherProps) {
  const [currentCode, setCurrentCode] = useState(defaultLanguage.code);
  const current =
    languages.find((language) => language.code === currentCode) ??
    defaultLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Language: ${current.label}. Change language`}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-lg font-sans text-[15px] font-medium text-mnh-text-muted-dark transition-colors duration-200 ease-out hover:text-mnh-text-white data-popup-open:text-mnh-text-white",
          fullWidth
            ? "h-[46px] w-full justify-between rounded-xl border border-mnh-dark-border px-4"
            : "h-10 px-2.5",
          className,
        )}
      >
        <span>{current.shortLabel}</span>
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
        <DropdownMenuRadioGroup
          value={currentCode}
          onValueChange={(value) => setCurrentCode(String(value))}
        >
          {languages.map((language) => (
            <DropdownMenuRadioItem
              key={language.code}
              value={language.code}
              className="px-2.5 py-2 text-sm text-mnh-text-muted-dark not-data-[variant=destructive]:focus:**:text-inherit focus:bg-mnh-dark-border focus:text-mnh-text-white data-highlighted:bg-mnh-dark-border data-highlighted:text-mnh-text-white data-checked:text-mnh-accent data-checked:focus:text-mnh-accent data-checked:data-highlighted:text-mnh-accent"
            >
              <span lang={language.code}>{language.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
