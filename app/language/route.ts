// app/language/route.ts
// GET /language?lang=en&path=/contact — choix de langue depuis le sélecteur (vrais liens, sans JavaScript).
// Pose le cookie de préférence mnh_lang (1 an, SameSite=Lax, Path=/) puis redirige (303, jamais mis en cache)
// vers la même page dans la langue choisie. Langue inconnue → langue par défaut ; chemin non sûr → accueil.
// Hors du proxy (matcher) : la redirection ne repasse par le proxy qu'à l'arrivée sur la page.
// Ce n'est pas une route du Backend (aucune donnée, aucun accès base).

import { connection, NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  isSafeRelativePath,
  localizedHref,
} from "@/lib/i18n/config";

export async function GET(request: NextRequest) {
  // Toujours rendu à la requête (cacheComponents tente de prérendre les GET).
  await connection();

  const requested = request.nextUrl.searchParams.get("lang");
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;

  const rawPath = request.nextUrl.searchParams.get("path");
  const path = isSafeRelativePath(rawPath) ? rawPath : "/";

  const response = NextResponse.redirect(new URL(localizedHref(locale, path), request.url), 303);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}
