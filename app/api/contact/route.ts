// app/api/contact/route.ts
// POST /api/contact — réception d'un message du formulaire de contact.
// Ordre des contrôles (F03) : limitation de débit → champ piège → validation Zod → enregistrement.
// Réponses : 201 succès · 400 données invalides · 429 trop de requêtes · 500 erreur serveur.

import { z } from "zod";
import { contactSchema } from "@/lib/validations/contact";
import { createContactMessage } from "@/lib/db/contact";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 }; // 5 messages / 10 min / adresse IP (Proposé)
const MAX_BODY_LENGTH = 10_000; // taille maximale du corps de la requête (caractères)

/** Le champ piège "website" est invisible pour un humain : s'il est rempli, c'est un robot. */
function isHoneypotFilled(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const value = (body as Record<string, unknown>).website;
  return typeof value === "string" && value.trim() !== "";
}

export async function POST(request: Request) {
  // 1. Limitation de débit (l'IP reste en mémoire, jamais en base)
  const limit = rateLimit(`contact:${getClientIp(request)}`, RATE_LIMIT);
  if (!limit.allowed) {
    return Response.json(
      { ok: false, error: "Trop de messages envoyés. Veuillez réessayer plus tard." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  // 2. Lecture du corps JSON
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_LENGTH) {
      return Response.json({ ok: false, error: "Requête trop volumineuse." }, { status: 400 });
    }
    body = JSON.parse(text);
  } catch {
    return Response.json({ ok: false, error: "Requête invalide." }, { status: 400 });
  }

  // 3. Champ piège rempli : refus silencieux (le robot croit que l'envoi a réussi, rien n'est enregistré)
  if (isHoneypotFilled(body)) {
    return Response.json({ ok: true, message: "Votre message a bien été envoyé." }, { status: 201 });
  }

  // 4. Validation Zod (RG09, RG10) : erreurs par champ, champs inconnus rejetés
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const { formErrors, fieldErrors } = z.flattenError(parsed.error);
    return Response.json(
      { ok: false, error: "Certains champs sont invalides.", fieldErrors, formErrors },
      { status: 400 }
    );
  }

  // 5. Enregistrement en base, statut NOUVEAU (RG11)
  try {
    const { full_name, email, subject, message } = parsed.data;
    await createContactMessage({ full_name, email, subject, message });
    return Response.json({ ok: true, message: "Votre message a bien été envoyé." }, { status: 201 });
  } catch (error) {
    console.error("[api/contact] Erreur d'enregistrement :", error);
    return Response.json(
      { ok: false, error: "Une erreur est survenue. Veuillez réessayer plus tard." },
      { status: 500 }
    );
  }
} 
