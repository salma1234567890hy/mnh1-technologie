import type { LucideIcon } from "lucide-react";

export type SearchCategory = "Pages" | "Services" | "Projects" | "Team";

export type SearchItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: SearchCategory;
  /** French + English terms so visitors can search in both languages. */
  keywords: string[];
  icon: LucideIcon;
};

/**
 * A source of searchable items. Static today; a future provider can load
 * blog posts (Prisma / API) without touching the search UI.
 */
export type SearchProvider = {
  id: string;
  getItems: () => SearchItem[];
};

export type SearchMatchRange = { start: number; end: number };

export type SearchResult = {
  item: SearchItem;
  /** Matched range in `item.title`, for highlighting. */
  titleMatch: SearchMatchRange | null;
};

export type SearchGroup = {
  label: string;
  results: SearchResult[];
};
