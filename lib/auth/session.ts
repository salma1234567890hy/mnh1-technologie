// lib/auth/session.ts
// Sessions Admin (RG28, RG29).
// Le navigateur reçoit un jeton aléatoire de 256 bits dans un cookie HttpOnly, Secure, SameSite=Strict.
// La base ne stocke que l'empreinte SHA-256 du jeton : le jeton en clair n'est JAMAIS stocké ni journalisé.
// Expiration : 8 h au maximum (expires_at) ou 30 min d'inactivité (contrôlée par findValidSession).

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import {
  createSession,
  findValidSession,
  revokeSession,
  touchSession,
  type AdminIdentity,
} from "@/lib/db/admin";

export const ADMIN_SESSION_COOKIE = "mnh_admin_session";

/** Durée de vie maximale d'une session : 8 heures. */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

const TOKEN_BYTES = 32; // 256 bits

/** 32 octets en base64url = exactement 43 caractères [A-Za-z0-9_-]. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/** Options du cookie de session, compatibles avec cookies().set() et NextResponse.cookies.set(). */
export type SessionCookieOptions = {
  httpOnly: true;
  secure: true;
  sameSite: "strict";
  path: "/";
  maxAge: number;
};

/**
 * Attributs communs aux cookies de création et de suppression.
 * Secure est toujours actif : les navigateurs l'acceptent aussi sur http://localhost en développement.
 */
function cookieOptions(maxAge: number): SessionCookieOptions {
  return { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge };
}

/** Options pour SUPPRIMER le cookie : mêmes attributs, Max-Age=0. */
export function getClearSessionCookieOptions(): SessionCookieOptions {
  return cookieOptions(0);
}

/** Jeton de session aléatoire : 32 octets (256 bits) de node:crypto, encodés en base64url. */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Vérifie le format d'un jeton (sans aucune requête SQL). */
export function isValidSessionTokenFormat(token: unknown): token is string {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}

/** Empreinte SHA-256 du jeton, en hexadécimal (64 caractères) : seule valeur stockée en base. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Ouvre une session pour un Admin authentifié.
 * Renvoie le jeton (à placer UNIQUEMENT dans le cookie) et les options du cookie.
 */
export async function createAdminSession(
  adminId: number
): Promise<{ token: string; cookieName: string; cookieOptions: SessionCookieOptions }> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await createSession(adminId, hashSessionToken(token), expiresAt);

  return {
    token,
    cookieName: ADMIN_SESSION_COOKIE,
    cookieOptions: cookieOptions(SESSION_MAX_AGE_SECONDS),
  };
}

/**
 * Admin connecté d'après le cookie de la requête, ou null.
 * Cookie absent, vide ou au format invalide → null, sans aucune requête SQL.
 * Une session valide voit son activité prolongée (expiration après 30 min d'inactivité).
 */
export async function getAdminFromRequest(): Promise<AdminIdentity | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionTokenFormat(token)) return null;

  const result = await findValidSession(hashSessionToken(token));
  if (!result) return null;

  await touchSession(result.session.id);
  return result.admin;
}

/**
 * Révoque la session correspondant au jeton (déconnexion).
 * Renvoie l'id de l'Admin, ou null si le jeton est invalide ou la session déjà révoquée.
 */
export async function destroyAdminSession(token: string | undefined | null): Promise<number | null> {
  if (!isValidSessionTokenFormat(token)) return null;
  return revokeSession(hashSessionToken(token));
}
