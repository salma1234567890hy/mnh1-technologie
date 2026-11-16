/**
 * Footer content — real data from https://www.mnhtechnologie.com.
 * Nothing in the footer JSX is hard-coded: edit here.
 */

export type OpeningHours = {
  /** IANA time zone used to compute the live "open / closed" status. */
  timeZone: string;
  /** ISO weekdays (1 = Monday … 7 = Sunday). */
  days: readonly number[];
  /** 24h "HH:MM", local to `timeZone`. */
  opens: string;
  closes: string;
  /** Short display string. */
  label: string;
};

export type SocialLink = {
  name: string;
  href: string;
  ariaLabel: string;
};

export const footerConfig = {
  company: {
    displayName: "MNH Technologie",
    /** Legal name — kept for future legal use, not displayed. */
    legalName: "MNH TECHNOLOGIE SARLAU",
    tagline: "L'intelligence dans chaque ligne de code",
  },
  contact: {
    email: "contact@mnhtechnologie.com",
    phone: {
      href: "tel:+212522524039",
      display: "+212 5 22 52 40 39",
    },
    address: {
      lines: ["Bureau 310, Technopark", "Route Nouaceur, 20150", "Casablanca, Maroc"],
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Technopark+Casablanca+Route+de+Nouaceur",
    },
  },
  hours: {
    timeZone: "Africa/Casablanca",
    days: [1, 2, 3, 4, 5],
    opens: "09:00",
    closes: "18:00",
    label: "Mon–Fri · 9:00–18:00",
  } satisfies OpeningHours,
  status: {
    open: "Open now: we're building.",
    closed: "Closed: we'll reply next business day.",
  },
  startProject: {
    title: "Have a project in mind?",
    text: "Tell us where to reach you, and we'll get back to you shortly.",
    placeholder: "your@email.com",
    error: "Please enter a valid email.",
    destination: "/contact",
  },
  social: [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/mnh-technologie",
      ariaLabel: "MNH Technologie on LinkedIn (opens in a new tab)",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/mnh.technologie/",
      ariaLabel: "MNH Technologie on Instagram (opens in a new tab)",
    },
  ] satisfies SocialLink[],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
} as const;

/** Pages listed in the footer: the main navigation minus Contact (covered by "Say hello"). */
export const FOOTER_EXCLUDED_PAGES = ["/contact"];
