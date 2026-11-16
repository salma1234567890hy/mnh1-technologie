// lib/i18n/config.ts
// Configuration des langues du site public — SOURCE UNIQUE (proxy, layouts, liens, sélecteur).
// Utilisable partout : serveur, client et proxy (aucun import serveur ici).
//
// ⚠️ DÉCISIONS PROVISOIRES, à valider avec l'encadrant (CLAUDE.md › Points à valider) :
//   - langues : fr, en ; langue par défaut : fr ;
//   - URL « option B » : la langue par défaut SANS préfixe (/contact), les autres avec (/en/contact) ;
//   - /fr/… redirige (308) vers la même page sans préfixe ;
//   - l'URL prime ; sur une URL sans préfixe, le cookie mnh_lang (s'il désigne une autre langue) redirige.
// Pour changer de langue par défaut, modifier DEFAULT_LOCALE (le proxy et les liens suivent).

export const LOCALES = ["fr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

/** Cookie de préférence de langue (fonctionnel), posé uniquement par le sélecteur via GET /language. */
export const LOCALE_COOKIE = "mnh_lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 an, en secondes

/** Route qui pose le cookie puis redirige (303) : utilisée par les liens du sélecteur, sans JavaScript. */
export const LANGUAGE_SWITCH_PATH = "/language";

/** Nom de chaque langue DANS sa propre langue (jamais traduit) + libellé court affiché. */
export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  fr: { short: "FR", name: "Français" },
  en: { short: "EN", name: "English" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Sépare le préfixe de langue d'un chemin.
 *   "/en/contact" → { locale: "en", path: "/contact" } · "/en" → { locale: "en", path: "/" }
 *   "/contact"    → { locale: null, path: "/contact" }
 */
export function splitLocale(pathname: string): { locale: Locale | null; path: string } {
  const segment = pathname.split("/")[1] ?? "";
  if (!isLocale(segment)) return { locale: null, path: pathname || "/" };
  const rest = pathname.slice(segment.length + 1);
  return { locale: segment, path: rest === "" ? "/" : rest };
}

/** Chemin sans préfixe de langue (pour comparer avec les href de navigation). */
export function stripLocale(pathname: string): string {
  return splitLocale(pathname).path;
}

/**
 * Lien interne dans la langue voulue. Les liens externes (https:, mailto:, tel:) et les ancres seules sont inchangés.
 *   localizedHref("fr", "/contact") → "/contact" · localizedHref("en", "/contact") → "/en/contact"
 *   localizedHref("en", "/") → "/en" · localizedHref("en", "/services#ai") → "/en/services#ai"
 */
export function localizedHref(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const path = stripLocale(href);
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path.startsWith("/#") ? path.slice(1) : path}`;
}

/** Lien du sélecteur : pose le cookie de `target`, puis ouvre la même page dans cette langue. */
export function languageSwitchHref(target: Locale, currentPathname: string): string {
  const params = new URLSearchParams({ lang: target, path: stripLocale(currentPathname) });
  return `${LANGUAGE_SWITCH_PATH}?${params.toString()}`;
}

/** Chemin relatif sûr (pas d'URL absolue, pas de « // », pas de « \ ») pour une redirection. */
export function isSafeRelativePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(value) &&
    value.length <= 2048
  );
}
