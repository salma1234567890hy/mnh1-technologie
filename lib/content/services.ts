/**
 * MNH services — single source for the search index and the footer.
 * Titles/descriptions in French are the real texts of the current site;
 * `label` is the English name used in the (English) navigation UI.
 */
export type Service = {
  slug: "web-development" | "mobile-apps" | "artificial-intelligence" | "digital-marketing";
  /** Anchor on the future /services page. */
  href: string;
  /** English label (footer, navigation). */
  label: string;
  /** French title (real site content). */
  title: string;
  /** French short description (real site content). */
  description: string;
};

export const services: Service[] = [
  {
    slug: "web-development",
    href: "/services#web-development",
    label: "Web Development",
    title: "Développement Web",
    description: "Des sites et plateformes conçus pour transformer les visiteurs en clients.",
  },
  {
    slug: "mobile-apps",
    href: "/services#mobile-apps",
    label: "Mobile Apps",
    title: "Applications Mobiles",
    description: "Des applications pensées pour être utilisées, pas juste téléchargées.",
  },
  {
    slug: "artificial-intelligence",
    href: "/services#artificial-intelligence",
    label: "Artificial Intelligence",
    title: "Intelligence Artificielle",
    description: "Des solutions IA concrètes pour automatiser et mieux piloter votre activité.",
  },
  {
    slug: "digital-marketing",
    href: "/services#digital-marketing",
    label: "Digital Marketing",
    title: "Marketing Digital",
    description: "Des stratégies d’acquisition structurées pour des résultats mesurables.",
  },
];
