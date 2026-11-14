// lib/slug.ts
// Génération de slugs d'URL à partir d'un titre (ex. offres d'emploi).
// Résultat : minuscules, accents retirés, uniquement a-z, 0-9 et tirets simples, sans tiret en début ni en fin.
// L'unicité n'est PAS garantie ici : elle est gérée en base (contrainte UNIQUE + suffixe -2, -3…).

/** Longueur maximale d'un slug (URL lisible ; la colonne job_offer.slug n'a pas de limite en base). */
export const MAX_SLUG_LENGTH = 80;

/** Format d'un slug : a-z / 0-9 séparés par des tirets simples (même règle que la migration 010). */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Le texte est-il un slug valide ? (format + longueur maximale ; aucune requête nécessaire sinon) */
export function isValidSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(value);
}

/** Slug utilisé si le titre ne contient aucun caractère exploitable. */
export const FALLBACK_SLUG = "offre";

/** Ligatures et caractères qui ne se décomposent pas avec NFD. */
const SPECIAL_CHARS: Record<string, string> = { œ: "oe", æ: "ae", ß: "ss", ø: "o", đ: "d", ł: "l" };

/** Coupe un slug à maxLength sans laisser de tiret final. */
function truncate(slug: string, maxLength: number): string {
  return slug.slice(0, maxLength).replace(/-+$/, "");
}

/** Transforme un texte en slug (ex. « Développeur·se Full-Stack (H/F) » → « developpeur-se-full-stack-h-f »). */
export function slugify(text: string, maxLength: number = MAX_SLUG_LENGTH): string {
  const slug = text
    .toLowerCase()
    .replace(/[œæßøđł]/g, (c) => SPECIAL_CHARS[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents (é → e, ç → c, …)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return truncate(slug, maxLength) || FALLBACK_SLUG;
}

/** Ajoute un suffixe numérique (-2, -3…) en respectant la longueur maximale. */
export function withSlugSuffix(base: string, suffix: number, maxLength: number = MAX_SLUG_LENGTH): string {
  if (suffix <= 1) return truncate(base, maxLength);
  const end = `-${suffix}`;
  return `${truncate(base, maxLength - end.length) || FALLBACK_SLUG}${end}`;
}
