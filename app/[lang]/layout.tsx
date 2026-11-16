import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { fontVariables } from "@/lib/fonts";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";
import { getSiteUrl } from "@/lib/i18n/metadata";
import "../globals.css";

/** Both languages are prerendered (required by cacheComponents for a root parameter). */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return {
    metadataBase: getSiteUrl(),
    title: { template: `%s | ${dict.meta.title}`, default: dict.meta.title },
    description: dict.meta.description,
  };
}

/**
 * Root layout of the PUBLIC site (one per language: /, /en).
 * Document, fonts, global styles and the dictionary for Client Components.
 * The Admin has its own root layout (app/admin/layout.tsx, always French).
 * Unknown language (only reachable for URLs the proxy skips) → 404.
 */
export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionaryFor(lang);

  return (
    <html lang={lang} className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={lang} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
