// lib/rate-limit.ts
// Limitation de débit en mémoire, par clé (ex. "contact:<ip>").
// L'adresse IP sert uniquement de clé temporaire en mémoire : elle n'est jamais enregistrée en base (RG06).
// Remarque : en mémoire = propre à un processus serveur ; suffisant pour un seul serveur Node.js.

type Bucket = { count: number; resetAt: number };

export type RateLimitConfig = { limit: number; windowMs: number };

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Configurations partagées.
 * Uniquement sous `npm run dev` (NODE_ENV = "development"), les limites sont relevées pour les tests manuels ;
 * `next build` et `next start` utilisent toujours NODE_ENV = "production" : la limite de production s'applique alors.
 */
export const RATE_LIMITS = {
  /** Suivi des visites (POST /api/analytics/track) : 60 requêtes / minute / adresse IP (300 en développement). */
  analytics: { limit: isDevelopment ? 300 : 60, windowMs: 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

const buckets = new Map<string, Bucket>();
let lastCleanup = Date.now();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();

  // Nettoyage périodique des entrées expirées (évite que la mémoire grossisse)
  if (now - lastCleanup > windowMs) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    lastCleanup = now;
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/** Adresse IP du client (en-têtes du proxy), utilisée uniquement comme clé en mémoire. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}