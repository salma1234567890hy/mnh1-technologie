// proxy.ts — routage des langues du site PUBLIC (convention Next 16, ex-middleware).
// Règles (lib/i18n/config.ts) :
//   /fr ou /fr/…           → 308 vers la même page SANS préfixe (une seule URL par page française) ;
//   /en ou /en/…           → servi tel quel (l'URL prime) ;
//   URL sans préfixe        → cookie mnh_lang = autre langue ? 307 vers /{langue}/… : rewrite interne vers /fr/….
// Accept-Language n'est PAS utilisé (robots, simplicité).
//
// Le matcher EXCLUT : /admin, /api, /_next, /brand, /videos, /language, favicon.ico et tout fichier avec extension.
// L'Admin et les API ne passent donc jamais ici. Ce proxy ne fait AUCUN contrôle d'accès.

import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, splitLocale } from "@/lib/i18n/config";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, path } = splitLocale(pathname);

  // 1. Préfixe de la langue par défaut : redirection permanente vers l'URL sans préfixe.
  if (locale === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url, 308);
  }

  // 2. Autre langue explicite dans l'URL : rien à faire.
  if (locale !== null) return NextResponse.next();

  // 3. Sans préfixe : préférence enregistrée par le sélecteur, sinon langue par défaut.
  const preferred = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(preferred) && preferred !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = path === "/" ? `/${preferred}` : `/${preferred}${path}`;
    // Temporaire : dépend d'un cookie, ne doit jamais être mis en cache.
    const response = NextResponse.redirect(url, 307);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = path === "/" ? `/${DEFAULT_LOCALE}` : `/${DEFAULT_LOCALE}${path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Tout sauf : admin, api, _next, brand, videos, language (segment entier), favicon.ico, fichiers avec extension.
    "/((?!(?:admin|api|_next|brand|videos|language)(?:/|$)|favicon\\.ico$|.*\\.[^/]+$).*)",
  ],
};
