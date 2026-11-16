export type NavigationLink = {
  label: string;
  href: string;
  /** Short description, used by the site search. */
  description?: string;
  /** French + English search terms. */
  keywords?: string[];
};

export type Language = {
  code: string;
  shortLabel: string;
  label: string;
};

export const mainNavigationLinks: NavigationLink[] = [
  {
    label: "Home",
    href: "/",
    description: "Web, mobile & AI solutions — MNH Technologie, Casablanca.",
    keywords: ["accueil", "home", "homepage", "page d'accueil", "mnh"],
  },
  {
    label: "About Us",
    href: "/about",
    description: "Who we are and how we work.",
    keywords: ["à propos", "a propos", "about", "agence", "agency", "entreprise", "company", "qui sommes-nous"],
  },
  {
    label: "Services",
    href: "/services",
    description: "Web development, mobile apps, AI and digital marketing.",
    keywords: ["services", "offres", "offers", "solutions", "prestations"],
  },
  {
    label: "Projects",
    href: "/projects",
    description: "Selected web, mobile and AI case studies.",
    keywords: ["projets", "projects", "réalisations", "realisations", "portfolio", "études de cas", "case studies", "work"],
  },
  {
    label: "Blog",
    href: "/blog",
    description: "News and articles from the MNH team.",
    keywords: ["blog", "actualités", "actualites", "news", "articles"],
  },
  {
    label: "Team",
    href: "/team",
    description: "Meet the people behind MNH Technologie.",
    keywords: ["équipe", "equipe", "team", "membres", "members", "people"],
  },
  {
    label: "Careers",
    href: "/careers",
    description: "Join MNH Technologie.",
    keywords: ["carrières", "carrieres", "careers", "jobs", "emploi", "recrutement", "hiring", "stage", "internship"],
  },
  {
    label: "Contact Us",
    href: "/contact",
    description: "Talk to us about your project.",
    keywords: ["contact", "contactez-nous", "email", "téléphone", "telephone", "phone", "adresse", "address", "devis", "quote"],
  },
  {
    label: "FAQ",
    href: "/faq",
    description: "Frequently asked questions.",
    keywords: ["faq", "questions", "aide", "help", "support"],
  },
];

export const headerCta: NavigationLink = {
  label: "Get In Touch",
  href: "/contact",
  description: "Parlons de votre projet.",
  keywords: ["get in touch", "contact", "projet", "project", "démarrer", "start", "devis", "quote"],
};

/** Ready for more languages (e.g. FR, AR) once i18n routing exists. */
export const languages: Language[] = [
  { code: "en", shortLabel: "EN", label: "English" },
];

export const defaultLanguage = languages[0];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
