import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { isLocale } from "@/lib/i18n/config";
import { localizedAlternates } from "@/lib/i18n/metadata";

/** canonical + hreflang (fr, en, x-default). Title and description come from the [lang] layout. */
export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { alternates: localizedAlternates(lang, "/") };
}

/** Home page. The surrounding <main id="main"> is provided by app/[lang]/(public)/layout.tsx. */
export default function Home() {
  return <HeroSection />;
}
