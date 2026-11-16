import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionaryFor } from "@/lib/i18n/get-dictionary";

/**
 * Catch-all of the public site: any path without a page (e.g. /contact until the Contact
 * card) → 404 rendered by ../not-found.tsx INSIDE the public layout (header + footer kept).
 * A real page (app/[lang]/(public)/contact/page.tsx) always wins over this catch-all.
 */
export async function generateMetadata({ params }: PageProps<"/[lang]/[...rest]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionaryFor(lang);
  return { title: dict.notFound.metaTitle, robots: { index: false, follow: true } };
}

export default function CatchAllNotFound() {
  notFound();
}
