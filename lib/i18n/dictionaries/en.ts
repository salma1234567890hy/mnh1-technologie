// lib/i18n/dictionaries/en.ts
// English dictionary — must match the French reference shape (Dictionary, from fr.ts).
// Hero, services, projects and team: faithful translations of the real French texts, nothing added.

import type { Dictionary } from "@/lib/i18n/dictionaries/fr";

const en: Dictionary = {
  meta: {
    title: "MNH Technologie",
    description:
      "We design, build and optimize web, mobile and AI solutions to attract more customers, automate operations and accelerate growth.",
  },

  common: {
    skipLink: "Skip to content",
    homeLink: "MNH Technologie — Home",
  },

  nav: {
    items: {
      home: { label: "Home", description: "Web, mobile & AI solutions — MNH Technologie, Casablanca." },
      about: { label: "About Us", description: "Who we are and how we work." },
      services: { label: "Services", description: "Web development, mobile apps, AI and digital marketing." },
      projects: { label: "Projects", description: "Selected web, mobile and AI case studies." },
      blog: { label: "Blog", description: "News and articles from the MNH team." },
      team: { label: "Team", description: "Meet the people behind MNH Technologie." },
      careers: { label: "Careers", description: "Join MNH Technologie." },
      contact: { label: "Contact Us", description: "Talk to us about your project." },
      faq: { label: "FAQ", description: "Frequently asked questions." },
    },
    cta: { label: "Get In Touch", description: "Let's talk about your project." },
    mainLabel: "Main navigation",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    menuTitle: "Navigation menu",
  },

  language: {
    trigger: "Language: {name} ({short}). Change language",
  },

  search: {
    trigger: "Search the site",
    title: "Search the site",
    inputLabel: "Search pages, services, projects",
    placeholder: "Search pages, services, projects…",
    closeKey: "Esc",
    closeLabel: " — close search",
    soon: "Soon",
    resultsCount: { none: "No results", one: "1 result", other: "{count} results" },
    resultsLabel: "Search results",
    noResults: "No results for",
    contactUs: "Contact us",
    help: { navigate: "navigate", open: "open", close: "close", escKey: "esc" },
    groups: {
      Pages: "Pages",
      Services: "Services",
      Projects: "Projects",
      Team: "Team",
      Suggestions: "Suggestions",
    },
  },

  services: {
    "web-development": {
      name: "Web Development",
      description: "Websites and platforms designed to turn visitors into customers.",
    },
    "mobile-apps": {
      name: "Mobile Apps",
      description: "Apps designed to be used, not just downloaded.",
    },
    "artificial-intelligence": {
      name: "Artificial Intelligence",
      description: "Practical AI solutions to automate and better manage your business.",
    },
    "digital-marketing": {
      name: "Digital Marketing",
      description: "Structured acquisition strategies for measurable results.",
    },
  },

  projects: {
    l7rayfi: "Internal smart platform — marketplace, AI matching, operations.",
    tcfpass: "AI-assisted education platform — education, AI features, maintenance.",
    "loffre-ma": "Moroccan marketplace platform — marketplace, mobile, support.",
    "equipe-afrique": "Multi-team operations platform — platform, UX, scalability.",
  },

  team: {
    "mohamed-sarghini": "Founder & CEO",
    "aimane-rhimini": "AI & Data Engineer",
    "walid-medour": "Senior Digital Marketing Expert",
    "nour-el-hoda": "Senior Manager",
  },

  hero: {
    badge: "Web, Mobile & AI Solutions",
    title: { before: "", highlight: "Digital", after: " products designed for tangible business results" },
    description:
      "We design, build and optimize web, mobile and AI solutions to attract more customers, automate operations and accelerate growth.",
    primaryCta: "Explore our services",
    secondaryCta: "See our work",
    countersLabel: "MNH Technologie in numbers",
    counters: { years: "Years of expertise", clients: "Clients", projects: "Projects" },
    scrollLabel: "Scroll to the next section",
  },

  footer: {
    columns: { studio: "Studio", startProject: "Start a project", explore: "Explore", sayHello: "Say hello" },
    status: { open: "Open now: we're building.", closed: "Closed: we'll reply next business day." },
    hours: "Mon–Fri · 9:00–18:00",
    mapsLabel: "{address} — open in Google Maps (new tab)",
    startProject: {
      title: "Have a project in mind?",
      text: "Tell us where to reach you, and we'll get back to you shortly.",
      emailLabel: "Your email address",
      placeholder: "your@email.com",
      submitLabel: "Start a project with this email",
      error: "Please enter a valid email.",
    },
    social: {
      linkedin: "MNH Technologie on LinkedIn (opens in a new tab)",
      instagram: "MNH Technologie on Instagram (opens in a new tab)",
    },
    legal: { privacy: "Privacy Policy", terms: "Terms of Use" },
    pagesNavLabel: "Footer pages",
    servicesNavLabel: "Footer services",
    legalNavLabel: "Legal",
    backToTop: "Back to top",
  },

  notFound: {
    metaTitle: "Page not found",
    label: "Error 404",
    title: { before: "Page ", highlight: "not found", after: " or coming soon" },
    text: "This page doesn't exist, or it will be online soon.",
    home: "Back to home",
  },

  error: {
    label: "Error",
    title: { before: "Something went ", highlight: "wrong", after: "" },
    text: "An unexpected problem is preventing this page from loading. You can try again.",
    retry: "Try again",
    home: "Back to home",
  },
};

export default en;
