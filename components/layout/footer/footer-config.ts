/**
 * Footer DATA — real data from https://www.mnhtechnologie.com.
 * Language-independent values only; every visible text is in the dictionaries (dict.footer).
 * Internal paths have no locale prefix: render them with localizedHref(locale, href).
 */

import type { Dictionary } from "@/lib/i18n/dictionaries/fr";

export type OpeningHours = {
  /** IANA time zone used to compute the live "open / closed" status. */
  timeZone: string;
  /** ISO weekdays (1 = Monday … 7 = Sunday). */
  days: readonly number[];
  /** 24h "HH:MM", local to `timeZone`. */
  opens: string;
  closes: string;
};

export type SocialLink = {
  /** Brand name, shown as is in every language. */
  name: string;
  href: string;
  /** Key of the accessible label in dict.footer.social. */
  labelKey: keyof Dictionary["footer"]["social"];
};

export const footerConfig = {
  company: {
    displayName: "MNH Technologie",
    /** Legal name — kept for future legal use, not displayed. */
    legalName: "MNH TECHNOLOGIE SARLAU",
    /** Brand motto: stays in FRENCH in every language (rendered with lang="fr"). */
    tagline: "L'intelligence dans chaque ligne de code",
  },
  contact: {
    email: "contact@mnhtechnologie.com",
    phone: {
      href: "tel:+212522524039",
      display: "+212 5 22 52 40 39",
    },
    /** Postal address: kept in FRENCH in every language (rendered with lang="fr"). */
    address: ["Bureau 310, Technopark", "Route Nouaceur, 20150", "Casablanca, Maroc"],
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Technopark+Casablanca+Route+de+Nouaceur",
  },
  hours: {
    timeZone: "Africa/Casablanca",
    days: [1, 2, 3, 4, 5],
    opens: "09:00",
    closes: "18:00",
  } satisfies OpeningHours,
  /** Page that reads the email with consumePrefillEmail(). */
  startProjectDestination: "/contact",
  social: [
    { name: "LinkedIn", href: "https://www.linkedin.com/company/mnh-technologie", labelKey: "linkedin" },
    { name: "Instagram", href: "https://www.instagram.com/mnh.technologie/", labelKey: "instagram" },
  ] satisfies SocialLink[],
  legal: [
    { key: "privacy", href: "/privacy" },
    { key: "terms", href: "/terms" },
  ] satisfies { key: keyof Dictionary["footer"]["legal"]; href: string }[],
} as const;

/** Pages listed in the footer: the main navigation minus Contact (covered by "Say hello"). */
export const FOOTER_EXCLUDED_PAGES = ["/contact"];
