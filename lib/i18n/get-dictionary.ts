// lib/i18n/get-dictionary.ts
// Dictionnaire de la langue courante, côté SERVEUR (Server Components, generateMetadata).
// La langue vient de la racine `app/[lang]` via next/root-params : aucun passage de props nécessaire.
// (Un fichier qui importe next/root-params échoue au build s'il est importé par un Client Component.)

import { lang as rootLang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("@/lib/i18n/dictionaries/fr").then((module) => module.default),
  en: () => import("@/lib/i18n/dictionaries/en").then((module) => module.default),
};

/** Dictionnaire d'une langue donnée (ex. generateMetadata, qui reçoit params). */
export function getDictionaryFor(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}

/** Langue de la requête (segment racine [lang]) ; langue inconnue → 404. */
export async function getLocale(): Promise<Locale> {
  const value = await rootLang();
  if (!isLocale(value)) notFound();
  return value;
}

/** Langue + dictionnaire de la requête courante. */
export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: await dictionaries[locale]() };
}
