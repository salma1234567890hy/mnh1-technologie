import { Brain, Code2, Megaphone, Smartphone, type LucideIcon } from "lucide-react";

/**
 * MNH services — single source of the service list (search index, footer, future /services page).
 * Structure only: names and descriptions are in the dictionaries (dict.services[slug]);
 * the French texts there are the real texts of the current site.
 * `href` has no locale prefix: render it with localizedHref(locale, href).
 */
export type ServiceSlug = "web-development" | "mobile-apps" | "artificial-intelligence" | "digital-marketing";

export type Service = {
  slug: ServiceSlug;
  /** Anchor on the future /services page (the page must expose id="<slug>"). */
  href: string;
  /** Lucide icon (home Services cards, site search) — docs/design-spec.md › Section 5. */
  icon: LucideIcon;
};

export const services: Service[] = [
  { slug: "web-development", href: "/services#web-development", icon: Code2 },
  { slug: "mobile-apps", href: "/services#mobile-apps", icon: Smartphone },
  { slug: "artificial-intelligence", href: "/services#artificial-intelligence", icon: Brain },
  { slug: "digital-marketing", href: "/services#digital-marketing", icon: Megaphone },
];
