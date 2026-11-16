"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { StatusScreen, statusPrimaryActionClass } from "@/components/shared/StatusScreen";
import { localizedHref } from "@/lib/i18n/config";

/**
 * Public 404, rendered inside the public layout (header and footer stay):
 * pages not built yet (catch-all [...rest]) and notFound() in public pages.
 * Honest text: the page doesn't exist, or will be online soon.
 *
 * Client Component: a not-found boundary receives no params, so the locale and texts come from
 * <I18nProvider> (app/[lang]/layout.tsx), like the public error page.
 *
 * ⚠️ Known Next 16 behaviour with TWO root layouts (app/[lang], app/admin): when a page calls
 * notFound(), the server sends status 404 + noindex with a minimal HTML shell, and the browser
 * renders this component (inside the public layout) from the RSC payload. See CLAUDE.md.
 */
export default function PublicNotFound() {
  const { locale, dict } = useI18n();
  const t = dict.notFound;

  return (
    <StatusScreen asMain={false} label={t.label} title={t.title} text={t.text}>
      <Link href={localizedHref(locale, "/")} className={statusPrimaryActionClass}>
        <ArrowLeft
          aria-hidden="true"
          size={16}
          className="transition-transform duration-300 ease-out group-hover/cta:-translate-x-0.5 motion-reduce:transition-none"
        />
        {t.home}
      </Link>
    </StatusScreen>
  );
}
