"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  StatusScreen,
  statusPrimaryActionClass,
  statusSecondaryActionClass,
} from "@/components/shared/StatusScreen";
import { localizedHref } from "@/lib/i18n/config";

/** Runtime error of a public page, inside the public layout (header and footer stay). Texts: dict.error. */
export default function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  const { locale, dict } = useI18n();
  const t = dict.error;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen asMain={false} label={t.label} title={t.title} text={t.text}>
      <button type="button" onClick={() => retry()} className={statusPrimaryActionClass}>
        <RotateCcw
          aria-hidden="true"
          size={16}
          className="transition-transform duration-300 ease-out group-hover/cta:-rotate-45 motion-reduce:transition-none"
        />
        {t.retry}
      </button>
      <Link href={localizedHref(locale, "/")} className={statusSecondaryActionClass}>
        {t.home}
      </Link>
    </StatusScreen>
  );
}
