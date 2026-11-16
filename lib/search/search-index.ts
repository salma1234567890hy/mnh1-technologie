import { FileText, FolderKanban, MessageSquare, UserRound } from "lucide-react";
import { getPageStatus, headerCta, mainNavigation } from "@/components/layout/navigation";
import { localizedHref, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/fr";
import { services, type ServiceSlug } from "@/lib/content/services";
import { slugify } from "@/lib/slug";
import type { SearchIndex, SearchItem } from "@/lib/search/types";

/*
 * Real content, taken from https://www.mnhtechnologie.com (home page).
 * Structure (ids, proper names, icons, FR + EN keywords) lives here; visible texts come
 * from the dictionary, so createSearchIndex() builds one index per language.
 * Destinations use anchors on the planned routes (e.g. /services#web-development);
 * they show the public 404 until those pages exist.
 */

/** Search-only keywords per service (icons: lib/content/services.ts). */
const serviceSearchMeta: Record<ServiceSlug, { keywords: string[] }> = {
  "web-development": {
    keywords: ["web", "site", "site web", "website", "développement", "development", "web development", "plateforme", "platform", "seo", "frontend", "backend"],
  },
  "mobile-apps": {
    keywords: ["mobile", "app", "application", "apps", "mobile apps", "ios", "android", "smartphone"],
  },
  "artificial-intelligence": {
    keywords: ["ia", "ai", "intelligence artificielle", "artificial intelligence", "automatisation", "automation", "machine learning", "data", "chatbot"],
  },
  "digital-marketing": {
    keywords: ["marketing", "digital marketing", "marketing digital", "acquisition", "seo", "ads", "publicité", "advertising", "réseaux sociaux", "social media", "growth"],
  },
};

/** Projects: proper names (not translated) + keywords; descriptions in dict.projects. */
const projects: { slug: keyof Dictionary["projects"]; title: string; keywords: string[] }[] = [
  {
    slug: "l7rayfi",
    title: "L7rayfi",
    keywords: ["l7rayfi", "marketplace", "place de marché", "matching", "ia", "ai", "opérations", "operations", "prestataires"],
  },
  {
    slug: "tcfpass",
    title: "TCFPass",
    keywords: ["tcfpass", "tcf", "éducation", "education", "edtech", "apprentissage", "learning", "ia", "ai", "maintenance"],
  },
  {
    slug: "loffre-ma",
    title: "Loffre.ma",
    keywords: ["loffre", "loffre.ma", "marketplace", "place de marché", "maroc", "morocco", "mobile", "support"],
  },
  {
    slug: "equipe-afrique",
    title: "Equipe Afrique",
    keywords: ["equipe afrique", "équipe afrique", "afrique", "africa", "plateforme", "platform", "ux", "scalabilité", "scalability", "collaboration"],
  },
];

/** Team: real names (not translated) + keywords; roles in dict.team. */
const teamMembers: { name: string; keywords: string[] }[] = [
  { name: "Mohamed Sarghini", keywords: ["pdg", "ceo", "fondateur", "founder", "directeur", "director"] },
  { name: "Aimane Rhimini", keywords: ["ia", "ai", "data", "ingénieur", "engineer", "machine learning"] },
  { name: "Walid Medour", keywords: ["marketing", "digital marketing", "marketing numérique", "growth"] },
  { name: "Nour El Hoda", keywords: ["responsable", "manager", "senior", "gestion", "management"] },
];

/** Pages shown as suggestions for an empty query (plus the header call to action). */
const SUGGESTED_PAGES = ["/", "/services", "/projects", "/about"];

/** Localized search index (titles, descriptions and hrefs in `locale`). */
export function createSearchIndex(dict: Dictionary, locale: Locale): SearchIndex {
  const pages: SearchItem[] = mainNavigation.map((link) => ({
    id: `page-${link.href === "/" ? "home" : slugify(link.href)}`,
    title: dict.nav.items[link.key].label,
    description: dict.nav.items[link.key].description,
    href: localizedHref(locale, link.href),
    status: link.status,
    category: "Pages",
    keywords: link.keywords,
    icon: FileText,
  }));

  const serviceItems: SearchItem[] = services.map((service) => ({
    id: `service-${service.slug}`,
    title: dict.services[service.slug].name,
    description: dict.services[service.slug].description,
    href: localizedHref(locale, service.href),
    status: getPageStatus(service.href),
    category: "Services",
    keywords: serviceSearchMeta[service.slug].keywords,
    icon: service.icon,
  }));

  const projectItems: SearchItem[] = projects.map((project) => ({
    id: `project-${project.slug}`,
    title: project.title,
    description: dict.projects[project.slug],
    href: localizedHref(locale, `/projects#${project.slug}`),
    status: getPageStatus("/projects"),
    category: "Projects",
    keywords: project.keywords,
    icon: FolderKanban,
  }));

  const teamItems: SearchItem[] = teamMembers.map((member) => {
    const slug = slugify(member.name) as keyof Dictionary["team"];
    return {
      id: `team-${slug}`,
      title: member.name,
      description: dict.team[slug],
      href: localizedHref(locale, `/team#${slug}`),
      status: getPageStatus("/team"),
      category: "Team",
      keywords: ["équipe", "equipe", "team", ...member.keywords],
      icon: UserRound,
    };
  });

  const suggestions: SearchItem[] = [
    ...pages.filter((item) => SUGGESTED_PAGES.some((href) => item.href === localizedHref(locale, href))),
    {
      id: "suggestion-get-in-touch",
      title: dict.nav.cta.label,
      description: dict.nav.cta.description,
      href: localizedHref(locale, headerCta.href),
      status: getPageStatus(headerCta.href),
      category: "Pages",
      keywords: headerCta.keywords,
      icon: MessageSquare,
    },
  ];

  return { items: [...pages, ...serviceItems, ...projectItems, ...teamItems], suggestions };
}
