// lib/i18n/metadata.ts
// Métadonnées SEO multilingues : base d'URL, canonical et balises hreflang.

import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, localizedHref, type Locale } from "@/lib/i18n/config";

/** URL publique du site (NEXT_PUBLIC_SITE_URL), http://localhost:3000 en secours. */
export function getSiteUrl(): URL {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    if (value) return new URL(value);
  } catch {
    // Valeur invalide : on retombe sur l'URL locale.
  }
  return new URL("http://localhost:3000");
}

/**
 * canonical (page dans la langue courante) + hreflang (fr, en, x-default = langue par défaut).
 * `path` est le chemin SANS préfixe de langue, ex. "/" ou "/contact".
 */
export function localizedAlternates(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const item of LOCALES) languages[item] = localizedHref(item, path);
  languages["x-default"] = localizedHref(DEFAULT_LOCALE, path);
  return { canonical: localizedHref(locale, path), languages };
}
