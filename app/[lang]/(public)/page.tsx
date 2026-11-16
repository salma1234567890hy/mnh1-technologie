import type { Metadata } from "next";
import { FinalCta } from "@/components/home/FinalCta";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { isLocale } from "@/lib/i18n/config";
import { localizedAlternates } from "@/lib/i18n/metadata";

/** canonical + hreflang (fr, en, x-default). Title and description come from the [lang] layout. */
export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { alternates: localizedAlternates(lang, "/") };
}

/**
 * Home page — sections in the order of docs/design-spec.md (Récapitulatif du rythme visuel).
 * Sections without real content yet are simply not rendered (FE-03):
 * Clients (3) · Why MNH (4) · Portfolio (6) · Team (7) · Testimonials (8) · Blog (9).
 * The surrounding <main id="main"> is provided by app/[lang]/(public)/layout.tsx.
 */
export default function Home() {
  return (
    <>
      <HeroSection />
      {/* 3. Clients · 4. Why MNH — not built yet */}
      <ServicesSection />
      {/* 6. Portfolio · 7. Team · 8. Testimonials · 9. Blog — not built yet */}
      <FinalCta />
    </>
  );
}
