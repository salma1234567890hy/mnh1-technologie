// lib/db/analytics.ts
// Accès aux données : suivi pseudonyme des visites (tables visitor, visitor_session, page_view — RG03 à RG08).
// Vie privée : aucune IP ni aucun user-agent brut n'est stocké (le schéma n'a pas de colonne pour cela).
// Le user-agent sert uniquement à déduire device_type et browser_family, puis il est oublié.
// Rôle mnh_app : UPDATE limité à visitor.last_seen_at et visitor_session.last_activity_at (007_grants.sql).
// Requêtes SQL paramétrées uniquement ($1, $2…) — aucune concaténation de valeurs.

import "server-only";
import { withTransaction } from "@/lib/db";

/** Une session se poursuit tant que la dernière activité date de moins de 30 minutes. */
export const SESSION_TIMEOUT_MINUTES = 30;

/** Le user-agent est tronqué avant toute analyse (limite le coût des expressions régulières). */
export const MAX_USER_AGENT_LENGTH = 512;

const MAX_REFERRER_HOST_LENGTH = 255; // contrainte visitor_session_referrer_host_chk

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Robots évidents : jamais comptés. */
const BOT_PATTERN = /bot|crawler|spider|headless/i;

/** Sections jamais suivies : administration et API (comparaison par segment : "/admin" et "/admin/…"). */
const EXCLUDED_PREFIXES = ["/admin", "/api"];

export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "AUTRE";

export type PageViewInput = {
  /** Identifiant lu dans le cookie du visiteur, ou null pour un nouveau visiteur. */
  visitorId: string | null;
  /** Chemin déjà validé et nettoyé par trackingSchema (≤ 300 caractères, sans query string). */
  path: string;
  /** URL du référent déjà validée (http/https), ou absente. Seul son domaine est conservé. */
  referrer?: string | null;
  /** En-tête User-Agent brut (jamais stocké). */
  userAgent: string | null;
};

/** Faut-il suivre cette requête ? Non pour /admin, /api et les robots évidents. */
export function shouldTrack(path: string, userAgent: string | null): boolean {
  const isExcludedPath = EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  if (isExcludedPath) return false;
  if (userAgent && BOT_PATTERN.test(userAgent.slice(0, MAX_USER_AGENT_LENGTH))) return false;
  return true;
}

/** Type d'appareil déduit du user-agent (valeurs de la contrainte visitor_session_device_type_chk). */
export function detectDeviceType(userAgent: string | null): DeviceType {
  const ua = (userAgent ?? "").slice(0, MAX_USER_AGENT_LENGTH);
  if (!ua) return "AUTRE";
  if (/ipad|tablet|kindle|silk|playbook/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
    return "TABLET";
  }
  if (/mobi|iphone|ipod|android|windows phone/i.test(ua)) return "MOBILE";
  return "DESKTOP";
}

/** Famille de navigateur déduite du user-agent, ou null si inconnue (l'ordre des tests compte). */
export function detectBrowserFamily(userAgent: string | null): string | null {
  const ua = (userAgent ?? "").slice(0, MAX_USER_AGENT_LENGTH);
  if (!ua) return null;
  if (/edg(e|a|ios)?\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/chrome|crios|chromium/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return null;
}

/** Nom de domaine du référent (sans chemin, query string ni identifiants), ou null. */
export function extractReferrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host && host.length <= MAX_REFERRER_HOST_LENGTH ? host : null;
  } catch {
    return null;
  }
}

/**
 * Enregistre une page vue, en UNE transaction :
 *  a) réutilise le visiteur s'il existe (verrouillé pour sérialiser ses requêtes), sinon le crée (UUID aléatoire) ;
 *  b) réutilise sa session si la dernière activité date de moins de 30 min, sinon en crée une ;
 *  c) insère la page vue et met à jour la dernière activité de la session ;
 *  d) renvoie { visitorId, sessionId }.
 * Un visitorId absent, mal formé ou inconnu donne un NOUVEAU visiteur : le client ne choisit jamais son identifiant.
 */
export async function trackPageView(input: PageViewInput): Promise<{ visitorId: string; sessionId: string }> {
  const candidateId = input.visitorId && UUID_PATTERN.test(input.visitorId) ? input.visitorId : null;

  return withTransaction(async (client) => {
    // a) Visiteur
    let visitorId: string | null = null;
    if (candidateId) {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM visitor WHERE id = $1 FOR UPDATE`,
        [candidateId]
      );
      if (existing.rows[0]) {
        visitorId = existing.rows[0].id;
        await client.query(`UPDATE visitor SET last_seen_at = now() WHERE id = $1`, [visitorId]);
      }
    }
    if (!visitorId) {
      const created = await client.query<{ id: string }>(
        `INSERT INTO visitor DEFAULT VALUES RETURNING id`
      );
      visitorId = created.rows[0].id;
    }

    // b) Session active (dernière activité < 30 min), sinon nouvelle session
    const active = await client.query<{ id: string }>(
      `SELECT id
       FROM visitor_session
       WHERE visitor_id = $1
         AND last_activity_at > now() - make_interval(mins => $2)
       ORDER BY last_activity_at DESC
       LIMIT 1`,
      [visitorId, SESSION_TIMEOUT_MINUTES]
    );

    let sessionId = active.rows[0]?.id ?? null;
    if (!sessionId) {
      const created = await client.query<{ id: string }>(
        `INSERT INTO visitor_session (visitor_id, entry_path, referrer_host, device_type, browser_family)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          visitorId,
          input.path,
          extractReferrerHost(input.referrer),
          detectDeviceType(input.userAgent),
          detectBrowserFamily(input.userAgent),
        ]
      );
      sessionId = created.rows[0].id;
    }

    // c) Page vue + dernière activité de la session
    await client.query(`INSERT INTO page_view (session_id, path) VALUES ($1, $2)`, [sessionId, input.path]);
    await client.query(`UPDATE visitor_session SET last_activity_at = now() WHERE id = $1`, [sessionId]);

    // d)
    return { visitorId, sessionId };
  });
}
