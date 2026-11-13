// app/api/admin/login/route.ts
// POST /api/admin/login — connexion d'un Admin (F07, RG26 à RG29).
// Ordre : limitation de débit → lecture JSON → validation Zod → compte → verrouillage → mot de passe → session.
// La réponse 401 est TOUJOURS identique (format invalide, compte absent, inactif, bloqué, mauvais mot de passe)
// et chaque refus effectue une vérification argon2id (réelle ou factice) : ni le contenu ni le temps de
// réponse ne révèlent si un email correspond à un compte.
// Réponses : 200 succès · 400 requête invalide · 401 identifiants refusés · 429 trop de tentatives · 500 erreur serveur.
// Toutes les réponses : Cache-Control: no-store (RG29).

import { cookies } from "next/headers";
import { LOGIN_ERROR_MESSAGE, loginSchema } from "@/lib/validations/auth";
import {
  findAdminByEmail,
  logAdminAction,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/lib/db/admin";
import { verifyDummyPassword, verifyPassword } from "@/lib/auth/password";
import { createAdminSession } from "@/lib/auth/session";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// Limitation de débit : 10 tentatives / 15 min / adresse IP en production.
// Uniquement sous `npm run dev` (NODE_ENV = "development"), la limite passe à 50 pour les tests manuels.
// `next build` et `next start` utilisent toujours NODE_ENV = "production" : la limite de 10 s'applique alors.
const RATE_LIMIT = {
  limit: process.env.NODE_ENV === "development" ? 50 : 10,
  windowMs: 15 * 60 * 1000,
};

const MAX_BODY_LENGTH = 10_000; // taille maximale du corps de la requête (caractères)

const NO_STORE = { "Cache-Control": "no-store" } as const;

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

/** Réponse unique pour tout refus d'authentification. */
function unauthorized() {
  return json(401, { ok: false, error: LOGIN_ERROR_MESSAGE });
}

function badRequest(error = "Requête invalide.") {
  return json(400, { ok: false, error });
}

/** Mot de passe brut du corps (pour la vérification factice), limité à 200 caractères. */
function readPasswordField(body: unknown): string {
  if (typeof body !== "object" || body === null) return "";
  const value = (body as Record<string, unknown>).password;
  return typeof value === "string" ? value.slice(0, 200) : "";
}

export async function POST(request: Request) {
  // 1. Limitation de débit (l'IP reste en mémoire, jamais en base)
  const limit = rateLimit(`admin-login:${getClientIp(request)}`, RATE_LIMIT);
  if (!limit.allowed) {
    return json(
      429,
      { ok: false, error: "Trop de tentatives de connexion. Veuillez réessayer plus tard." },
      { "Retry-After": String(limit.retryAfterSeconds) }
    );
  }

  try {
    // 2. Lecture du corps JSON (10 Ko maximum)
    let body: unknown;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_LENGTH) {
        return badRequest("Requête trop volumineuse.");
      }
      body = JSON.parse(text);
    } catch {
      return badRequest();
    }

    // 3. Validation Zod
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      // Champ inconnu, ou corps qui n'est pas un objet : requête mal construite → 400.
      const isMalformed = parsed.error.issues.some(
        (issue) => issue.code === "unrecognized_keys" || issue.path.length === 0
      );
      if (isMalformed) {
        return badRequest();
      }
      // Email ou mot de passe au format invalide : même réponse (et même durée) qu'un échec d'authentification.
      await verifyDummyPassword(readPasswordField(body));
      return unauthorized();
    }

    const { email, password } = parsed.data;

    // 4. Compte absent ou inactif → vérification factice
    const admin = await findAdminByEmail(email);
    if (!admin || !admin.is_active) {
      await verifyDummyPassword(password);
      return unauthorized();
    }

    // 5. Compte verrouillé (RG27) : refus même si le mot de passe est correct ;
    //    le vrai mot de passe n'est pas vérifié et le compteur n'est pas modifié.
    if (admin.locked_until && admin.locked_until.getTime() > Date.now()) {
      await verifyDummyPassword(password);
      return unauthorized();
    }

    // 6. Vérification du mot de passe (temps constant)
    const passwordOk = await verifyPassword(admin.password_hash, password);
    if (!passwordOk) {
      await recordFailedLogin(admin.id);
      return unauthorized();
    }

    // 7. Succès : compteur remis à zéro, session, journal, cookie HttpOnly / Secure / SameSite=Strict
    await recordSuccessfulLogin(admin.id);
    const session = await createAdminSession(admin.id);
    await logAdminAction(admin.id, "LOGIN");

    const cookieStore = await cookies();
    cookieStore.set(session.cookieName, session.token, session.cookieOptions);

    return json(200, { ok: true });
  } catch (error) {
    // Aucun email, mot de passe ni jeton dans le journal : uniquement l'erreur technique.
    console.error(
      "[api/admin/login] Erreur inattendue :",
      error instanceof Error ? `${error.name}: ${error.message}` : "erreur inconnue"
    );
    return json(500, { ok: false, error: "Une erreur est survenue. Veuillez réessayer plus tard." });
  }
}
