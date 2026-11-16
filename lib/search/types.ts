import type { LucideIcon } from "lucide-react";
import type { PageStatus } from "@/components/layout/navigation";

/** Internal category ids (display labels come from dict.search.groups). */
export type SearchCategory = "Pages" | "Services" | "Projects" | "Team";

export type SearchItem = {
  id: string;
  title: string;
  description: string;
  /** Already localized (localizedHref). */
  href: string;
  /** "planned": destination not built yet → "Soon" badge in the results. */
  status: PageStatus;
  category: SearchCategory;
  /** French + English terms so visitors can search in both languages. */
  keywords: string[];
  icon: LucideIcon;
};

/** A localized search index: every searchable item + the suggestions shown for an empty query. */
export type SearchIndex = {
  items: SearchItem[];
  suggestions: SearchItem[];
};

export type SearchMatchRange = { start: number; end: number };

export type SearchResult = {
  item: SearchItem;
  /** Matched range in `item.title`, for highlighting. */
  titleMatch: SearchMatchRange | null;
};

export type SearchGroup = {
  /** Stable id (category, or "Suggestions"), for keys and element ids. */
  id: SearchCategory | "Suggestions";
  results: SearchResult[];
};
