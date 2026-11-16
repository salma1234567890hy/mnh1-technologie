// lib/i18n/dictionaries/fr.ts
// Dictionnaire FRANÇAIS — langue de référence : le type Dictionary est dérivé de cet objet,
// et en.ts doit le respecter (une clé manquante = erreur de compilation).
// Textes réels du site (Hero, services, projets, équipe) : ne pas les modifier sans validation.
// Les noms propres (MNH Technologie, projets, membres) ne sont pas ici : ils ne se traduisent pas.
// Placeholders : {name}, {short}, {address} — remplacés par formatMessage() (lib/i18n/format.ts).

const fr = {
  meta: {
    title: "MNH Technologie",
    description:
      "Nous concevons, développons et optimisons des solutions web, mobile et IA pour attirer plus de clients, automatiser les opérations et accélérer la croissance.",
  },

  common: {
    skipLink: "Aller au contenu",
    homeLink: "MNH Technologie — Accueil",
  },

  nav: {
    items: {
      home: { label: "Accueil", description: "Solutions web, mobile et IA — MNH Technologie, Casablanca." },
      about: { label: "À propos", description: "Qui nous sommes et comment nous travaillons." },
      services: { label: "Services", description: "Développement web, applications mobiles, IA et marketing digital." },
      projects: { label: "Projets", description: "Une sélection d'études de cas web, mobile et IA." },
      blog: { label: "Blog", description: "Actualités et articles de l'équipe MNH." },
      team: { label: "Équipe", description: "Les personnes derrière MNH Technologie." },
      careers: { label: "Carrières", description: "Rejoindre MNH Technologie." },
      contact: { label: "Contact", description: "Parlez-nous de votre projet." },
      faq: { label: "FAQ", description: "Questions fréquentes." },
    },
    cta: { label: "Nous contacter", description: "Parlons de votre projet." },
    mainLabel: "Navigation principale",
    openMenu: "Ouvrir le menu de navigation",
    closeMenu: "Fermer le menu de navigation",
    menuTitle: "Menu de navigation",
  },

  language: {
    /** Contient le libellé visible ({short}) : WCAG 2.5.3. */
    trigger: "Langue : {name} ({short}). Changer de langue",
  },

  search: {
    trigger: "Rechercher sur le site",
    title: "Rechercher sur le site",
    inputLabel: "Rechercher des pages, services, projets",
    placeholder: "Rechercher des pages, services, projets…",
    closeKey: "Échap",
    closeLabel: " — fermer la recherche",
    /** Badge of a page that does not exist yet (status "planned" in navigation.ts). */
    soon: "Bientôt",
    /** Announced to screen readers (role="status"); {count} = number of results. */
    resultsCount: { none: "Aucun résultat", one: "1 résultat", other: "{count} résultats" },
    resultsLabel: "Résultats de recherche",
    noResults: "Aucun résultat pour",
    contactUs: "Nous contacter",
    help: { navigate: "naviguer", open: "ouvrir", close: "fermer", escKey: "échap" },
    groups: {
      Pages: "Pages",
      Services: "Services",
      Projects: "Projets",
      Team: "Équipe",
      Suggestions: "Suggestions",
    },
  },

  /** Textes réels du site actuel. */
  services: {
    "web-development": {
      name: "Développement Web",
      description: "Des sites et plateformes conçus pour transformer les visiteurs en clients.",
    },
    "mobile-apps": {
      name: "Applications Mobiles",
      description: "Des applications pensées pour être utilisées, pas juste téléchargées.",
    },
    "artificial-intelligence": {
      name: "Intelligence Artificielle",
      description: "Des solutions IA concrètes pour automatiser et mieux piloter votre activité.",
    },
    "digital-marketing": {
      name: "Marketing Digital",
      description: "Des stratégies d’acquisition structurées pour des résultats mesurables.",
    },
  },

  /** Textes réels du site actuel (les titres sont des noms propres, dans lib/search/search-index.ts). */
  projects: {
    l7rayfi: "Plateforme intelligente interne — place de marché, matching IA, opérations.",
    tcfpass: "Plateforme éducative assistée par IA — éducation, fonctionnalités IA, maintenance.",
    "loffre-ma": "Plateforme marketplace marocaine — place de marché, mobile, support.",
    "equipe-afrique": "Plateforme opérations multi-équipes — plateforme, UX, scalabilité.",
  },

  /** Rôles réels (les noms sont dans lib/search/search-index.ts). */
  team: {
    "mohamed-sarghini": "Fondateur & PDG",
    "aimane-rhimini": "Ingénieur IA & Data",
    "walid-medour": "Expert senior en marketing numérique",
    "nour-el-hoda": "Responsable senior",
  },

  hero: {
    badge: "Solutions Web, Mobile & IA",
    title: { before: "Produits ", highlight: "digitaux", after: " pensés pour des résultats business concrets" },
    description:
      "Nous concevons, développons et optimisons des solutions web, mobile et IA pour attirer plus de clients, automatiser les opérations et accélérer la croissance.",
    primaryCta: "Découvrir nos services",
    secondaryCta: "Voir nos réalisations",
    countersLabel: "MNH Technologie en chiffres",
    counters: { years: "Ans d'expertise", clients: "Clients", projects: "Projets" },
    scrollLabel: "Faire défiler vers la section suivante",
  },

  footer: {
    columns: { studio: "Studio", startProject: "Démarrer un projet", explore: "Explorer", sayHello: "Écrivez-nous" },
    status: { open: "Ouvert : nous sommes au travail.", closed: "Fermé : nous vous répondons le prochain jour ouvré." },
    hours: "Lun–Ven · 9:00–18:00",
    mapsLabel: "{address} — ouvrir dans Google Maps (nouvel onglet)",
    startProject: {
      title: "Un projet en tête ?",
      text: "Laissez-nous votre e-mail, nous revenons vers vous rapidement.",
      emailLabel: "Votre adresse e-mail",
      placeholder: "votre@email.com",
      submitLabel: "Démarrer un projet avec cet e-mail",
      error: "Veuillez saisir une adresse e-mail valide.",
    },
    social: {
      linkedin: "MNH Technologie sur LinkedIn (s'ouvre dans un nouvel onglet)",
      instagram: "MNH Technologie sur Instagram (s'ouvre dans un nouvel onglet)",
    },
    legal: { privacy: "Politique de confidentialité", terms: "Conditions d'utilisation" },
    pagesNavLabel: "Pages du site",
    servicesNavLabel: "Nos services",
    legalNavLabel: "Informations légales",
    backToTop: "Retour en haut",
  },

  notFound: {
    metaTitle: "Page introuvable",
    label: "Erreur 404",
    title: { before: "Page ", highlight: "introuvable", after: " ou bientôt disponible" },
    text: "Cette page n'existe pas, ou elle sera bientôt en ligne.",
    home: "Retour à l'accueil",
  },

  error: {
    label: "Erreur",
    title: { before: "Une erreur est ", highlight: "survenue", after: "" },
    text: "Un problème inattendu empêche l'affichage de cette page. Vous pouvez réessayer.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
  },
};

/** Forme de tous les dictionnaires (dérivée du français). */
export type Dictionary = typeof fr;

export default fr;
