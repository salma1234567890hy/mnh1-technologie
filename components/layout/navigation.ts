import { stripLocale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";

/**
 * Site navigation — STRUCTURE only (keys, paths, search keywords).
 * Visible texts (labels, descriptions) come from the dictionaries: dict.nav.items[key].
 * Paths are WITHOUT locale prefix: render them with localizedHref(locale, href).
 */

export type NavKey = keyof Dictionary["nav"]["items"];

/**
 * "live": the page exists · "planned": not built yet (shows the public 404 "coming soon").
 * Planned links stay visible (the spec requires the 9 navbar links) but are never prefetched,
 * and the search marks them with a "Soon" badge. Switch to "live" when the page ships.
 */
export type PageStatus = "live" | "planned";

export type NavigationItem = {
  key: NavKey;
  href: string;
  status: PageStatus;
  /** French + English search terms (language-independent, used by the site search). */
  keywords: string[];
};

export const mainNavigation: NavigationItem[] = [
  { key: "home", status: "live", href: "/", keywords: ["accueil", "home", "homepage", "page d'accueil", "mnh"] },
  {
    key: "about",
    status: "planned",
    href: "/about",
    keywords: ["à propos", "a propos", "about", "agence", "agency", "entreprise", "company", "qui sommes-nous"],
  },
  { key: "services", status: "planned", href: "/services", keywords: ["services", "offres", "offers", "solutions", "prestations"] },
  {
    key: "projects",
    status: "planned",
    href: "/projects",
    keywords: ["projets", "projects", "réalisations", "realisations", "portfolio", "études de cas", "case studies", "work"],
  },
  { key: "blog", status: "planned", href: "/blog", keywords: ["blog", "actualités", "actualites", "news", "articles"] },
  { key: "team", status: "planned", href: "/team", keywords: ["équipe", "equipe", "team", "membres", "members", "people"] },
  {
    key: "careers",
    status: "planned",
    href: "/careers",
    keywords: ["carrières", "carrieres", "careers", "jobs", "emploi", "recrutement", "hiring", "stage", "internship"],
  },
  {
    key: "contact",
    status: "planned",
    href: "/contact",
    keywords: ["contact", "contactez-nous", "email", "téléphone", "telephone", "phone", "adresse", "address", "devis", "quote"],
  },
  { key: "faq", status: "planned", href: "/faq", keywords: ["faq", "questions", "aide", "help", "support"] },
];

/** Header call to action (texts: dict.nav.cta). */
export const headerCta = {
  href: "/contact",
  keywords: ["get in touch", "nous contacter", "contact", "projet", "project", "démarrer", "start", "devis", "quote"],
};

/**
 * Status of any internal link (no locale prefix, anchors and sub-paths allowed):
 * "/services#ai" → status of "/services". A path that is not a navigation page
 * (e.g. /privacy, /terms) is "planned" until it is added here.
 */
export function getPageStatus(href: string): PageStatus {
  const path = stripLocale(href.split("#")[0] || "/");
  const page = mainNavigation.find((item) =>
    item.href === "/" ? path === "/" : path === item.href || path.startsWith(`${item.href}/`),
  );
  return page?.status ?? "planned";
}

/** Next <Link> prefetch value: planned pages are never prefetched (they would 404). */
export function prefetchFor(href: string): false | undefined {
  return getPageStatus(href) === "planned" ? false : undefined;
}

/** Is `href` (no locale prefix) the current page? Ignores the locale prefix of `pathname`. */
export function isActivePath(pathname: string, href: string) {
  const path = stripLocale(pathname);
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}
