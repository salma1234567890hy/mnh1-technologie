// lib/i18n/format.ts
// Remplacement des placeholders {clé} d'un texte de dictionnaire (serveur et client).

export function formatMessage(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
