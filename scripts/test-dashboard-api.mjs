// scripts/test-dashboard-api.mjs
// Tests du suivi des visites (POST /api/analytics/track) et des routes du dashboard Admin
// (GET /api/admin/dashboard/overview · traffic · top-pages). Le serveur doit tourner : npm run dev.
// Utilisation : npm run test:dashboard
//          ou : node --env-file=.env.local scripts/test-dashboard-api.mjs
//
// SÉCURITÉ : refuse de s'exécuter si NODE_ENV=production ou si la base visée n'est pas mnh_dev.
// Prérequis : TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD dans .env.local (compte de développement uniquement).
// Ni ces valeurs, ni le cookie de session, ni l'identifiant visiteur ne sont jamais affichés.
//
// Données : le script crée quelques visiteurs / sessions / pages vues, puis les supprime à la fin
// (même en cas d'échec) : UNIQUEMENT les visiteurs identifiés par les cookies mnh_vid reçus,
// via MIGRATION_DATABASE_URL (leurs sessions et pages vues suivent par ON DELETE CASCADE).
// Aucune ligne de admin_audit_log ni d'aucune autre table n'est supprimée
// (la connexion et la déconnexion du script y ajoutent donc une ligne LOGIN et une ligne LOGOUT).

import { randomBytes } from "node:crypto";
import pg from "pg";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_ADMIN_EMAIL;
const PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const EXPECTED_DATABASE = "mnh_dev";

const TRACK = `${BASE_URL}/api/analytics/track`;
const DASHBOARD = ["overview", "traffic", "top-pages"].map((r) => `${BASE_URL}/api/admin/dashboard/${r}`);
const ADMIN_CACHE = "private, no-store";
const PUBLIC_CACHE = "no-store";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// ---------------------------------------------------------------- Sécurité

/** Nom de la base dans une URL postgres://…/<base>, ou null. */
function databaseName(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, "")) || null;
  } catch {
    return null;
  }
}

function refuse(message) {
  console.error(`⛔ ${message}`);
  console.error("   Aucun test lancé, aucune donnée modifiée.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production") refuse("NODE_ENV=production : ce script est réservé au développement.");
for (const name of ["DATABASE_URL", "MIGRATION_DATABASE_URL"]) {
  if (!process.env[name]) refuse(`${name} est manquant (lancez le script avec npm run test:dashboard).`);
  const db = databaseName(process.env[name]);
  if (db !== EXPECTED_DATABASE) refuse(`${name} ne vise pas la base ${EXPECTED_DATABASE} (base visée : ${db ?? "inconnue"}).`);
}
if (!EMAIL || !PASSWORD) refuse("TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD doivent être définis dans .env.local.");

// ---------------------------------------------------------------- Affichage

let reussis = 0;
let total = 0;

function verifier(condition, message) {
  total += 1;
  if (condition) reussis += 1;
  console.log(`${condition ? "✅" : "❌"} ${message}`);
  return condition;
}

const cles = (objet) => Object.keys(objet ?? {}).join(",");

// ---------------------------------------------------------------- Outils

const owner = new pg.Client({ connectionString: process.env.MIGRATION_DATABASE_URL });

/** Identifiants des visiteurs créés par le script (valeurs des cookies mnh_vid reçus) : jamais affichés. */
const visiteursCrees = new Set();

async function comptes() {
  const { rows } = await owner.query(
    `SELECT (SELECT count(*) FROM visitor)::int AS v,
            (SELECT count(*) FROM visitor_session)::int AS s,
            (SELECT count(*) FROM page_view)::int AS p`
  );
  return rows[0];
}
const memesComptes = (a, b) => a.v === b.v && a.s === b.s && a.p === b.p;

/** Envoie un suivi de page ; mémorise le visiteur créé pour le nettoyage. */
async function suivre(corps, { cookie, headers = {}, type = "application/json", brut = false } = {}) {
  const res = await fetch(TRACK, {
    method: "POST",
    headers: { "content-type": type, "user-agent": UA, ...(cookie ? { cookie } : {}), ...headers },
    body: brut ? corps : JSON.stringify(corps),
  });
  const texte = await res.text();
  const vid = (res.headers.get("set-cookie") ?? "").match(/(?:^|[;,]\s*)mnh_vid=([^;]+)/)?.[1] ?? null;
  if (vid) visiteursCrees.add(vid);
  let json = null;
  try {
    json = JSON.parse(texte);
  } catch {
    /* corps vide (204) */
  }
  return { status: res.status, json, texte, vid, setCookie: res.headers.get("set-cookie"), cc: res.headers.get("cache-control") };
}

async function get(url, cookie, method = "GET") {
  const res = await fetch(url, { method, headers: cookie ? { cookie } : {} });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* pas de JSON */
  }
  return { status: res.status, json, cc: res.headers.get("cache-control"), allow: res.headers.get("allow") };
}

// ---------------------------------------------------------------- Tests : suivi des visites

/** Chemin propre à cette exécution, pour le retrouver dans top-pages. */
const CHEMIN_TEST = `/test-dashboard-${randomBytes(4).toString("hex")}`;

async function testsSuivi() {
  console.log("\n— suivi des visites (POST /api/analytics/track)");

  const r1 = await suivre({ path: CHEMIN_TEST, referrer: "https://www.google.com/" });
  const attributs = (r1.setCookie ?? "").toLowerCase();
  verifier(r1.status === 204 && r1.texte === "" && r1.cc === PUBLIC_CACHE, `Corps valide → ${r1.status} (attendu : 204), sans corps, Cache-Control: ${r1.cc}`);
  verifier(
    Boolean(r1.vid) && ["httponly", "secure", "samesite=lax", "path=/", "max-age=34128000"].every((a) => attributs.includes(a)),
    "Cookie mnh_vid posé (HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age 13 mois) — valeur masquée"
  );

  const cookie = r1.vid ? `mnh_vid=${r1.vid}` : null;
  const r2 = await suivre({ path: CHEMIN_TEST }, { cookie });
  verifier(r2.status === 204 && r2.vid === r1.vid, `Même cookie → ${r2.status} (attendu : 204), même visiteur : ${r2.vid === r1.vid}`);
  const r3 = await suivre({ path: CHEMIN_TEST }, { cookie, type: "text/plain;charset=UTF-8" });
  verifier(r3.status === 204, `Content-Type text/plain (sendBeacon) → ${r3.status} (attendu : 204)`);

  const url = await suivre({ path: "https://exemple.com/x" });
  verifier(url.status === 400 && url.cc === PUBLIC_CACHE, `path URL complète → ${url.status} (attendu : 400) · ${JSON.stringify(url.json?.details?.fieldErrors)}`);

  const inconnu = await suivre({ path: "/", visitorId: "x" });
  verifier(
    inconnu.status === 400 && inconnu.json?.details?.formErrors?.length > 0,
    `Champ inconnu → ${inconnu.status} (attendu : 400) · formErrors : ${JSON.stringify(inconnu.json?.details?.formErrors)}`
  );

  let avant = await comptes();
  const admin = await suivre({ path: "/admin/candidatures" });
  verifier(admin.status === 204 && !admin.vid && memesComptes(avant, await comptes()), `path /admin/… → ${admin.status} (attendu : 204), aucune ligne ajoutée`);

  avant = await comptes();
  const robot = await suivre({ path: CHEMIN_TEST }, { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" } });
  verifier(robot.status === 204 && !robot.vid && memesComptes(avant, await comptes()), `user-agent Googlebot → ${robot.status} (attendu : 204), aucune ligne ajoutée`);

  avant = await comptes();
  const pirate = await suivre({ path: CHEMIN_TEST }, { headers: { origin: "https://site-pirate.com" } });
  verifier(pirate.status === 403 && memesComptes(avant, await comptes()), `Origin étranger → ${pirate.status} (attendu : 403) · ${pirate.texte}`);

  const gros = await suivre({ path: `/${"a".repeat(5000)}` });
  verifier(gros.status === 413, `Corps > 4096 octets → ${gros.status} (attendu : 413)`);
}

// ---------------------------------------------------------------- Tests : dashboard Admin

async function testsDashboard() {
  console.log("\n— dashboard Admin (GET /api/admin/dashboard/*)");

  for (const url of DASHBOARD) {
    const r = await get(url, null);
    verifier(r.status === 401 && r.cc === ADMIN_CACHE, `${url.replace(BASE_URL, "")} sans cookie → ${r.status} (attendu : 401) · Cache-Control: ${r.cc}`);
  }

  // Connexion UNE seule fois
  const login = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const jeton = (login.headers.get("set-cookie") ?? "").match(/mnh_admin_session=([^;]+)/)?.[1];
  if (!verifier(login.status === 200 && Boolean(jeton), `Connexion Admin → ${login.status} (attendu : 200) — cookie masqué`)) return;
  const cookie = `mnh_admin_session=${jeton}`;

  try {
    // Structure (sans paramètre : 30d)
    const [overview, traffic, top] = DASHBOARD;
    let r = await get(overview, cookie);
    const o = r.json?.data;
    verifier(
      r.status === 200 && r.cc === ADMIN_CACHE && o?.period === "30d" &&
        cles(o) === "period,range,traffic,applications,contactMessages,jobOffers" &&
        cles(o.traffic) === "current,previous,change" &&
        cles(o.applications?.byStatus) === "EN_ATTENTE,EN_COURS_EXAMEN,ACCEPTEE,REFUSEE" &&
        cles(o.jobOffers?.byStatus) === "BROUILLON,PUBLIEE,DESACTIVEE,ARCHIVEE" &&
        o.traffic.current.pageViews >= 3,
      `overview → ${r.status} (attendu : 200), période 30d par défaut, structure conforme, pages vues ≥ 3 (${o?.traffic?.current?.pageViews})`
    );

    r = await get(traffic, cookie);
    const t = r.json?.data;
    verifier(
      r.status === 200 && r.cc === ADMIN_CACHE && cles(t) === "series,breakdown" && t.series.length === 30 &&
        cles(t.series[0]) === "date,visitors,sessions,pageViews" && cles(t.breakdown) === "period,devices,browsers,sources",
      `traffic → ${r.status} (attendu : 200), ${t?.series?.length} points, structure conforme`
    );
    for (const [periode, points] of [["7d", 7], ["90d", 90]]) {
      r = await get(`${traffic}?period=${periode}`, cookie);
      verifier(r.status === 200 && r.json?.data?.series?.length === points, `traffic ?period=${periode} → ${r.status}, ${r.json?.data?.series?.length} points (attendu : ${points})`);
    }

    r = await get(`${top}?limit=50`, cookie);
    const page = Array.isArray(r.json?.data) ? r.json.data.find((p) => p.path === CHEMIN_TEST) : null;
    verifier(
      r.status === 200 && r.cc === ADMIN_CACHE && page?.pageViews === 3 && page?.uniqueVisitors === 1,
      `top-pages → ${r.status} (attendu : 200), la page du script apparaît : ${page ? `${page.pageViews} vues, ${page.uniqueVisitors} visiteur` : "non"} (attendu : 3 vues, 1 visiteur)`
    );

    // Paramètres invalides
    for (const [url, query] of [[overview, "period=1an"], [top, "limit=0"], [top, "limit=51"], [overview, "foo=1"]]) {
      r = await get(`${url}?${query}`, cookie);
      verifier(
        r.status === 400 && r.cc === ADMIN_CACHE && r.json?.error === "Paramètres invalides." && "formErrors" in (r.json?.details ?? {}),
        `${url.replace(BASE_URL, "")}?${query} → ${r.status} (attendu : 400)`
      );
    }

    // Méthode non autorisée
    for (const url of DASHBOARD) {
      r = await get(url, cookie, "POST");
      verifier(r.status === 405 && r.allow === "GET" && r.cc === ADMIN_CACHE, `POST ${url.replace(BASE_URL, "")} → ${r.status} (attendu : 405)`);
    }
  } finally {
    // Déconnexion, puis l'ancien cookie doit être refusé
    const logout = await fetch(`${BASE_URL}/api/admin/logout`, { method: "POST", headers: { cookie } });
    const apres = await get(DASHBOARD[0], cookie);
    verifier(logout.status === 200 && apres.status === 401 && apres.cc === ADMIN_CACHE, `Déconnexion (${logout.status}) puis overview → ${apres.status} (attendu : 401)`);
  }
}

// ---------------------------------------------------------------- Lancement

let erreur = null;
try {
  await owner.connect();
  const { rows } = await owner.query("SELECT current_database() AS db");
  if (rows[0].db !== EXPECTED_DATABASE) refuse(`La connexion vise la base ${rows[0].db}, pas ${EXPECTED_DATABASE}.`);

  await testsSuivi();
  await testsDashboard();
} catch (e) {
  erreur = e;
} finally {
  // Nettoyage : uniquement les visiteurs créés par ce script (cascade sur sessions et pages vues).
  try {
    const ids = [...visiteursCrees].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    const res = ids.length ? await owner.query("DELETE FROM visitor WHERE id = ANY($1::uuid[])", [ids]) : { rowCount: 0 };
    console.log(`\n🧹 Nettoyage : ${res.rowCount} visiteur(s) de test supprimé(s) (avec leurs sessions et pages vues).`);
  } catch (e) {
    console.error("❌ Nettoyage impossible :", e.message);
    process.exitCode = 1;
  }
  await owner.end().catch(() => {});
}

if (erreur) {
  console.error(`❌ Exécution interrompue. Le serveur tourne-t-il sur ${BASE_URL} (npm run dev) ?`);
  console.error("  ", erreur.cause?.code ?? erreur.message);
  process.exitCode = 1;
} else {
  console.log(`\nRésumé : ${reussis}/${total} vérifications réussies`);
  if (reussis !== total) process.exitCode = 1;
}
