import {
  Brain,
  Code2,
  FileText,
  FolderKanban,
  Megaphone,
  MessageSquare,
  Smartphone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { headerCta, mainNavigationLinks } from "@/components/layout/navigation";
import { services, type Service } from "@/lib/content/services";
import type { SearchItem, SearchProvider } from "@/lib/search/types";
import { slugify } from "@/lib/slug";

/*
 * Real content, taken from https://www.mnhtechnologie.com (home page).
 * Destinations use anchors on the planned routes (e.g. /services#web-development);
 * they 404 until those pages exist.
 */

const pagesProvider: SearchProvider = {
  id: "pages",
  getItems: () =>
    mainNavigationLinks.map((link) => ({
      id: `page-${link.href === "/" ? "home" : slugify(link.href)}`,
      title: link.label,
      description: link.description ?? "",
      href: link.href,
      category: "Pages",
      keywords: link.keywords ?? [],
      icon: FileText,
    })),
};

/** Search-only metadata per service; titles, descriptions and hrefs come from lib/content/services.ts. */
const serviceSearchMeta: Record<Service["slug"], { icon: LucideIcon; keywords: string[] }> = {
  "web-development": {
    icon: Code2,
    keywords: ["web", "site", "site web", "website", "développement", "development", "plateforme", "platform", "seo", "frontend", "backend"],
  },
  "mobile-apps": {
    icon: Smartphone,
    keywords: ["mobile", "app", "application", "apps", "ios", "android", "smartphone"],
  },
  "artificial-intelligence": {
    icon: Brain,
    keywords: ["ia", "ai", "intelligence artificielle", "artificial intelligence", "automatisation", "automation", "machine learning", "data", "chatbot"],
  },
  "digital-marketing": {
    icon: Megaphone,
    keywords: ["marketing", "digital marketing", "marketing digital", "acquisition", "seo", "ads", "publicité", "advertising", "réseaux sociaux", "social media", "growth"],
  },
};

const servicesProvider: SearchProvider = {
  id: "services",
  getItems: () =>
    services.map((service) => ({
      id: `service-${service.slug}`,
      title: service.title,
      description: service.description,
      href: service.href,
      category: "Services",
      keywords: [service.label, ...serviceSearchMeta[service.slug].keywords],
      icon: serviceSearchMeta[service.slug].icon,
    })),
};

const projectsProvider: SearchProvider = {
  id: "projects",
  getItems: () => [
    {
      id: "project-l7rayfi",
      title: "L7rayfi",
      description: "Plateforme intelligente interne — place de marché, matching IA, opérations.",
      href: "/projects#l7rayfi",
      category: "Projects",
      keywords: ["l7rayfi", "marketplace", "place de marché", "matching", "ia", "ai", "opérations", "operations", "prestataires"],
      icon: FolderKanban,
    },
    {
      id: "project-tcfpass",
      title: "TCFPass",
      description: "Plateforme éducative assistée par IA — éducation, fonctionnalités IA, maintenance.",
      href: "/projects#tcfpass",
      category: "Projects",
      keywords: ["tcfpass", "tcf", "éducation", "education", "edtech", "apprentissage", "learning", "ia", "ai", "maintenance"],
      icon: FolderKanban,
    },
    {
      id: "project-loffre-ma",
      title: "Loffre.ma",
      description: "Plateforme marketplace marocaine — place de marché, mobile, support.",
      href: "/projects#loffre-ma",
      category: "Projects",
      keywords: ["loffre", "loffre.ma", "marketplace", "place de marché", "maroc", "morocco", "mobile", "support"],
      icon: FolderKanban,
    },
    {
      id: "project-equipe-afrique",
      title: "Equipe Afrique",
      description: "Plateforme opérations multi-équipes — plateforme, UX, scalabilité.",
      href: "/projects#equipe-afrique",
      category: "Projects",
      keywords: ["equipe afrique", "équipe afrique", "afrique", "africa", "plateforme", "platform", "ux", "scalabilité", "scalability", "collaboration"],
      icon: FolderKanban,
    },
  ],
};

const teamMembers = [
  { name: "Mohamed Sarghini", role: "Fondateur & PDG", keywords: ["pdg", "ceo", "fondateur", "founder", "directeur", "director"] },
  { name: "Aimane Rhimini", role: "Ingénieur IA & Data", keywords: ["ia", "ai", "data", "ingénieur", "engineer", "machine learning"] },
  { name: "Walid Medour", role: "Expert senior en marketing numérique", keywords: ["marketing", "digital marketing", "marketing numérique", "growth"] },
  { name: "Nour El Hoda", role: "Responsable senior", keywords: ["responsable", "manager", "senior", "gestion", "management"] },
];

const teamProvider: SearchProvider = {
  id: "team",
  getItems: () =>
    teamMembers.map((member) => ({
      id: `team-${slugify(member.name)}`,
      title: member.name,
      description: member.role,
      href: `/team#${slugify(member.name)}`,
      category: "Team",
      keywords: ["équipe", "equipe", "team", ...member.keywords],
      icon: UserRound,
    })),
};

/** Register new providers here (e.g. blog posts later). */
export const searchProviders: SearchProvider[] = [
  pagesProvider,
  servicesProvider,
  projectsProvider,
  teamProvider,
];

/** Items shown when the input is empty. */
export const suggestionItems: SearchItem[] = [
  ...pagesProvider.getItems().filter((item) =>
    ["/", "/services", "/projects", "/about"].includes(item.href),
  ),
  {
    id: "suggestion-get-in-touch",
    title: headerCta.label,
    description: headerCta.description ?? "",
    href: headerCta.href,
    category: "Pages",
    keywords: headerCta.keywords ?? [],
    icon: MessageSquare,
  },
];
