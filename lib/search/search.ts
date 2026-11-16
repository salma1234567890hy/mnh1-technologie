import type {
  SearchCategory,
  SearchGroup,
  SearchIndex,
  SearchItem,
  SearchMatchRange,
  SearchResult,
} from "@/lib/search/types";

const CATEGORY_ORDER: SearchCategory[] = ["Pages", "Services", "Projects", "Team"];

/** Lower-case and strip diacritics ("Développement" → "developpement"). */
export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Finds `query` in `text` ignoring case and accents, and returns the range
 * in the ORIGINAL string (so the match can be highlighted).
 */
export function findMatchRange(text: string, query: string): SearchMatchRange | null {
  const needle = normalizeText(query.trim());
  if (!needle) return null;

  // Build the normalized string while keeping a map back to original indexes.
  let normalized = "";
  const indexMap: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const part = normalizeText(text[i]);
    for (let j = 0; j < part.length; j++) {
      normalized += part[j];
      indexMap.push(i);
    }
  }

  const start = normalized.indexOf(needle);
  if (start === -1) return null;
  const end = indexMap[start + needle.length - 1] + 1;
  return { start: indexMap[start], end };
}

/** True when one of the words of `text` starts with `needle` ("ai" ≠ "email"). */
function hasWordStartingWith(text: string, needle: string) {
  const normalized = normalizeText(text);
  if (normalized.startsWith(needle)) return true;
  return normalized
    .split(/[^a-z0-9]+/)
    .some((word) => word.startsWith(needle));
}

type ScoredResult = SearchResult & { score: number };

function scoreItem(item: SearchItem, query: string): ScoredResult | null {
  const needle = normalizeText(query.trim());
  const title = normalizeText(item.title);

  // 1. Title (substring, highlighted). Prefix matches rank above inner matches.
  const titleMatch = findMatchRange(item.title, query.trim());
  if (titleMatch) {
    const score = title.startsWith(needle) ? 300 : hasWordStartingWith(item.title, needle) ? 280 : 250;
    return { item, titleMatch, score };
  }

  // 2. Keywords (FR + EN), exact keyword first.
  const keywords = item.keywords.map(normalizeText);
  if (keywords.includes(needle)) {
    return { item, titleMatch: null, score: 220 };
  }
  if (item.keywords.some((keyword) => hasWordStartingWith(keyword, needle))) {
    return { item, titleMatch: null, score: 200 };
  }

  // 3. Description.
  if (hasWordStartingWith(item.description, needle)) {
    return { item, titleMatch: null, score: 100 };
  }

  return null;
}

/** Groups keep their best result's rank; ties follow the category order. */
function groupResults(results: ScoredResult[]): SearchGroup[] {
  return CATEGORY_ORDER.map((category) => {
    const groupResults = results.filter((result) => result.item.category === category);
    return {
      id: category,
      bestScore: groupResults[0]?.score ?? 0,
      results: groupResults.map(({ item, titleMatch }) => ({ item, titleMatch })),
    };
  })
    .filter((group) => group.results.length > 0)
    .sort((a, b) => b.bestScore - a.bestScore)
    .map(({ id, results: groupItems }) => ({ id, results: groupItems }));
}

/**
 * Pure search function, independent from the UI (the index is localized by createSearchIndex).
 * Empty query → "Suggestions" group.
 */
export function search(query: string, index: SearchIndex): SearchGroup[] {
  if (!query.trim()) {
    return [
      {
        id: "Suggestions",
        results: index.suggestions.map((item) => ({ item, titleMatch: null })),
      },
    ];
  }

  const scored = index.items
    .map((item) => scoreItem(item, query))
    .filter((result): result is ScoredResult => result !== null)
    .sort((a, b) => b.score - a.score);

  return groupResults(scored);
}
