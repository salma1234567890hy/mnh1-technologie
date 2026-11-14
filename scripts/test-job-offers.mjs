// scripts/test-job-offers.mjs
// Tests de la gestion des offres d'emploi (BE-09) :
//   Admin  : GET/POST /api/admin/job-offers · GET/PATCH /api/admin/job-offers/[id]
//            POST /api/admin/job-offers/[id]/publish · /deactivate · /archive
//   Public : GET /api/job-offers · GET /api/job-offers/[slug]
// Le serveur doit tourner : npm run dev.
// Utilisation : npm run test:job-offers
//          ou : node --env-file=.env.local scripts/test-job-offers.mjs
//
// SÉCURITÉ : refuse de s'exécuter si NODE_ENV=production ou si la base visée n'est pas mnh_dev.
// Prérequis : TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD dans .env.local (compte de développement uniquement).
// Ni ces valeurs ni le cookie de session ne sont jamais affichés.
//
// Données : le script crée des offres « [TEST-BE09] » (via l'API et via MIGRATION_DATABASE_URL pour les états
// particuliers des tests publics) et une candidature de test. À la fin (même en cas d'échec), il supprime
// UNIQUEMENT ces offres, ces candidatures (et leurs fichiers éventuels) et sa propre session si elle existe encore.
// Il ne supprime JAMAIS de ligne de admin_audit_log : chaque exécution y laisse donc LOGIN, LOGOUT, CREATE_OFFER,
// UPDATE_OFFER, PUBLISH_OFFER, DEACTIVATE_OFFER et ARCHIVE_OFFER (entity_id = offres supprimées ;
// aucune clé étrangère ne relie le journal aux offres).

import { randomBytes } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ADMIN = `${BASE_URL}/api/admin/job-offers`;
const PUBLIC = `${BASE_URL}/api/job-offers`;
const EMAIL = process.env.TEST_ADMIN_EMAIL;
const PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const EXPECTED_DATABASE = "mnh_dev";
const ADMIN_CC = "private, no-store";
const PUBLIC_CC = "public, max-age=60";
const ROOT = path.resolve(process.env.PRIVATE_STORAGE_DIR || "storage/private");
const PUBLIC_KEYS = ["id", "slug", "title", "description", "location", "contractType", "missions", "requiredSkills", "publishedAt", "closingDate"];

/** Suffixe propre à cette exécution (titres et slugs uniques). */
const RUN = randomBytes(3).toString("hex");

// ---------------------------------------------------------------- Sécurité

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
  if (!process.env[name]) refuse(`${name} est manquant (lancez le script avec npm run test:job-offers).`);
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

// ---------------------------------------------------------------- Outils

const owner = new pg.Client({ connectionString: process.env.MIGRATION_DATABASE_URL });

/** Offres créées par le script (nettoyage) ; candidatures retrouvées par job_offer_id. */
const offresCreees = new Set();
let cookie = null;

async function appel(url, { method = "GET", corps, type = "application/json", headers = {}, auth = true, brut = false } = {}) {
  const res = await fetch(url, {
    method,
    headers: { ...(corps !== undefined && type ? { "content-type": type } : {}), ...(auth && cookie ? { cookie } : {}), ...headers },
    body: corps === undefined ? undefined : brut ? corps : JSON.stringify(corps),
  });
  const texte = await res.text();
  let json = null;
  try {
    json = JSON.parse(texte);
  } catch {
    /* corps non JSON */
  }
  return { status: res.status, json, texte, cc: res.headers.get("cache-control"), allow: res.headers.get("allow"), location: res.headers.get("location") };
}

const offreValide = (titre, extra = {}) => ({
  title: titre,
  description: "Description de test BE-09 générée par scripts/test-job-offers.mjs.",
  missions: ["Mission de test"],
  requiredSkills: ["SQL"],
  contractType: "CDI",
  location: "Casablanca",
  ...extra,
});

async function auditsDe(id) {
  const { rows } = await owner.query(
    "SELECT action, metadata FROM admin_audit_log WHERE entity_type = 'job_offer' AND entity_id = $1 ORDER BY id",
    [id]
  );
  return rows.map((r) => {
    const m = r.metadata ?? {};
    const detail = m.fields ? m.fields.join("+") : m.from ? `${m.from}>${m.to}` : m.status ?? "";
    return `${r.action}:${detail}`;
  });
}

/** Offre insérée directement (états particuliers des tests publics). */
async function insererOffre(cle, statut, publieeIlYa, cloture) {
  const { rows } = await owner.query(
    `INSERT INTO job_offer (slug, title, description, missions, required_skills, contract_type, location, status, published_at, closing_date, created_by)
     VALUES ($1, $2, 'Description publique de test BE-09 pour la lecture publique.', '{"Mission publique"}', '{"SQL"}', 'CDI', 'Casablanca', $3,
             CASE WHEN $4::text IS NULL THEN NULL ELSE now() - $4::interval END,
             CASE $5::text
               WHEN 'today' THEN (now() AT TIME ZONE 'Africa/Casablanca')::date
               WHEN 'yesterday' THEN (now() AT TIME ZONE 'Africa/Casablanca')::date - 1
               WHEN 'future' THEN '2099-12-31'::date
               ELSE NULL END,
             (SELECT id FROM admin_user WHERE email = lower($6)))
     RETURNING id, slug`,
    [`test-be09-public-${RUN}-${cle}`, `[TEST-BE09] Offre publique ${RUN} ${cle}`, statut, publieeIlYa, cloture, EMAIL]
  );
  offresCreees.add(rows[0].id);
  return rows[0];
}

// ---------------------------------------------------------------- Tests Admin

async function testsSansSession() {
  console.log("\n— Admin sans session");
  for (const [methode, url, corps] of [
    ["GET", ADMIN],
    ["POST", ADMIN, offreValide("[TEST-BE09] Sans session")],
    ["GET", `${ADMIN}/1`],
    ["PATCH", `${ADMIN}/1`, { location: "Rabat" }],
    ["POST", `${ADMIN}/1/publish`],
  ]) {
    const r = await appel(url, { method: methode, corps, auth: false });
    verifier(r.status === 401 && r.cc === ADMIN_CC, `${methode} ${url.replace(BASE_URL, "")} sans cookie → ${r.status} (attendu : 401)`);
  }
}

async function connexion() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const jeton = (res.headers.get("set-cookie") ?? "").match(/mnh_admin_session=([^;]+)/)?.[1];
  cookie = jeton ? `mnh_admin_session=${jeton}` : null;
  return verifier(res.status === 200 && Boolean(cookie), `Connexion Admin (une seule fois) → ${res.status} (attendu : 200) — cookie masqué`);
}

async function testsCreation() {
  console.log("\n— création (POST /api/admin/job-offers)");
  const titre = `[TEST-BE09] Offre ${RUN} Développeur`;
  const slugAttendu = `test-be09-offre-${RUN}-developpeur`;

  let r = await appel(ADMIN, { method: "POST", corps: offreValide(titre) });
  const a = r.json?.data;
  if (a?.id) offresCreees.add(a.id);
  verifier(r.status === 201 && r.cc === ADMIN_CC && a?.slug === slugAttendu && r.location === `/api/admin/job-offers/${a?.id}`,
    `POST valide → ${r.status}, slug ${a?.slug}, Location ${r.location}`);

  r = await appel(ADMIN, { method: "POST", corps: offreValide(titre) });
  const b = r.json?.data;
  if (b?.id) offresCreees.add(b.id);
  verifier(r.status === 201 && b?.slug === `${slugAttendu}-2`, `POST même titre → ${r.status}, slug suffixé ${b?.slug}`);

  for (const [libelle, options, attendu] of [
    ["Champ slug envoyé", { corps: offreValide(titre, { slug: "mon-slug" }) }, 400],
    ["Titre trop court", { corps: offreValide("ab") }, 400],
    ["Date de clôture passée", { corps: offreValide(titre, { closingDate: "2020-01-01" }) }, 400],
    ["Origin étranger", { corps: offreValide(titre), headers: { origin: "https://site-pirate.com" } }, 403],
    ["Content-Type text/plain", { corps: offreValide(titre), type: "text/plain" }, 415],
    ["Corps > 32 768 octets", { corps: offreValide(titre, { description: "x".repeat(33_000) }) }, 413],
    ["JSON invalide", { corps: "{ pas du json", brut: true }, 400],
  ]) {
    r = await appel(ADMIN, { method: "POST", ...options });
    verifier(r.status === attendu && r.cc === ADMIN_CC, `${libelle} → ${r.status} (attendu : ${attendu})`);
  }
  return { a, b };
}

async function testsListeDetail({ a, b }) {
  console.log("\n— liste et détail Admin");
  let r = await appel(`${ADMIN}?q=${RUN}&status=BROUILLON`);
  const ids = (r.json?.data?.items ?? []).map((i) => i.id);
  verifier(r.status === 200 && r.json?.data?.total === 2 && ids[0] === b.id && ids[1] === a.id && typeof r.json.data.items[0].applicationCount === "number",
    `?q=<exécution>&status=BROUILLON → ${r.json?.data?.total} offres, tri récent, nombre de candidatures présent`);
  r = await appel(`${ADMIN}?q=${RUN}&status=BROUILLON&sort=oldest&pageSize=1&page=2`);
  verifier(r.status === 200 && r.json?.data?.items?.[0]?.id === b.id && r.json.data.totalPages === 2, "Tri oldest + pagination (page 2, pageSize 1)");
  for (const q of ["status=OUVERTE", "page=0", "pageSize=101", "sort=abc", "foo=1"]) {
    r = await appel(`${ADMIN}?${q}`);
    verifier(r.status === 400 && r.cc === ADMIN_CC, `Liste ?${q} → ${r.status} (attendu : 400)`);
  }
  r = await appel(`${ADMIN}/${a.id}`);
  verifier(r.status === 200 && r.json?.data?.isOpen === false && r.json.data.status === "BROUILLON", `Détail d'un brouillon → ${r.status}, isOpen ${r.json?.data?.isOpen}`);
  for (const [chemin, attendu] of [["999999", 404], ["abc", 400], [`${a.id}?foo=1`, 400]]) {
    r = await appel(`${ADMIN}/${chemin}`);
    verifier(r.status === attendu && r.cc === ADMIN_CC, `Détail /${chemin} → ${r.status} (attendu : ${attendu})`);
  }
}

async function testsModificationEtActions({ a, b }) {
  console.log("\n— modification (PATCH) et actions de statut");
  const patch = (id, corps, options = {}) => appel(`${ADMIN}/${id}`, { method: "PATCH", corps, ...options });
  const action = (id, nom, options = {}) => appel(`${ADMIN}/${id}/${nom}`, { method: "POST", ...options });
  const slugA = `test-be09-offre-${RUN}-ingenieur`;

  let r = await patch(a.id, { title: `[TEST-BE09] Offre ${RUN} Ingénieur` });
  verifier(r.status === 200 && r.json?.data?.slug === slugA && JSON.stringify(r.json?.data?.fields) === '["TITLE","SLUG"]',
    `PATCH titre d'un brouillon → ${r.status}, slug recalculé, fields ${JSON.stringify(r.json?.data?.fields)}`);
  r = await patch(a.id, { title: `[TEST-BE09] Offre ${RUN} Ingénieur` });
  verifier(r.status === 409 && r.json?.error === "Aucune modification.", `PATCH mêmes valeurs → ${r.status} (attendu : 409)`);
  r = await patch(a.id, {});
  verifier(r.status === 400, `PATCH {} → ${r.status} (attendu : 400)`);

  r = await action(a.id, "deactivate");
  verifier(r.status === 409 && JSON.stringify(r.json?.allowedActions) === '["publish","archive"]', `Désactiver un brouillon → ${r.status}, allowedActions ${JSON.stringify(r.json?.allowedActions)}`);
  r = await action(a.id, "publish");
  verifier(r.status === 200 && r.json?.data?.from === "BROUILLON" && r.json?.data?.to === "PUBLIEE", `Publier → ${r.status} (BROUILLON → PUBLIEE)`);
  r = await appel(`${ADMIN}/${a.id}`);
  const datePublication = r.json?.data?.publishedAt;
  verifier(r.json?.data?.isOpen === true && Boolean(datePublication), "Détail après publication → isOpen true");

  r = await patch(a.id, { title: `[TEST-BE09] Offre ${RUN} Titre publié` });
  verifier(r.status === 200 && r.json?.data?.slug === slugA, `PATCH titre après publication (sans candidature) → ${r.status}, slug figé`);
  await owner.query(
    `INSERT INTO application (job_offer_id, full_name, email, phone, cv_storage_key, cv_original_name, cv_size_bytes, consent_data_processing)
     VALUES ($1, '[TEST-BE09] Candidat', 'candidat.be09@mnh.local', '+212600000000', 'cv/00000000-0000-4000-8000-00000000be09.pdf', 'cv.pdf', 1000, true)`,
    [a.id]
  );
  r = await patch(a.id, { title: `[TEST-BE09] Offre ${RUN} Autre titre` });
  verifier(r.status === 409 && JSON.stringify(r.json?.fields) === '["TITLE"]', `PATCH titre avec une candidature → ${r.status}, champs verrouillés ${JSON.stringify(r.json?.fields)}`);
  r = await patch(a.id, { description: "Description modifiée après une candidature de test BE-09." });
  verifier(r.status === 200 && JSON.stringify(r.json?.data?.fields) === '["DESCRIPTION"]', `PATCH description avec une candidature → ${r.status}`);

  r = await action(a.id, "deactivate");
  verifier(r.status === 200 && r.json?.data?.to === "DESACTIVEE", `Désactiver → ${r.status}`);
  r = await action(a.id, "publish");
  const apres = await appel(`${ADMIN}/${a.id}`);
  verifier(r.status === 200 && apres.json?.data?.publishedAt === datePublication, "Republier → date de publication d'origine conservée");
  r = await action(a.id, "archive");
  verifier(r.status === 200 && r.json?.data?.to === "ARCHIVEE", `Archiver → ${r.status}`);
  r = await action(a.id, "publish");
  verifier(r.status === 409 && JSON.stringify(r.json?.allowedActions) === "[]", `Publier une offre archivée → ${r.status}, allowedActions []`);
  r = await patch(a.id, { description: "Tentative de modification sur une offre archivée." });
  verifier(r.status === 409 && r.json?.error === "Une offre archivée ne peut plus être modifiée.", `PATCH sur une offre archivée → ${r.status} (attendu : 409)`);

  await owner.query("UPDATE job_offer SET closing_date = (now() AT TIME ZONE 'Africa/Casablanca')::date - 1 WHERE id = $1", [b.id]);
  r = await action(b.id, "publish");
  verifier(r.status === 409 && r.json?.error === "La date de clôture est passée : modifiez-la avant de publier.", `Publier avec une date de clôture passée → ${r.status} (attendu : 409)`);
  r = await action(b.id, "archive", { corps: {} });
  verifier(r.status === 400 && r.json?.error === "Aucun corps attendu.", `Action avec un corps non vide → ${r.status} (attendu : 400)`);

  console.log("\n— journal d'audit");
  const attenduA = ["CREATE_OFFER:BROUILLON", "UPDATE_OFFER:TITLE+SLUG", "PUBLISH_OFFER:BROUILLON>PUBLIEE", "UPDATE_OFFER:TITLE", "UPDATE_OFFER:DESCRIPTION",
    "DEACTIVATE_OFFER:PUBLIEE>DESACTIVEE", "PUBLISH_OFFER:DESACTIVEE>PUBLIEE", "ARCHIVE_OFFER:PUBLIEE>ARCHIVEE"];
  const obtenuA = await auditsDe(a.id);
  verifier(JSON.stringify(obtenuA) === JSON.stringify(attenduA), `Offre A : ${obtenuA.length} lignes, une par succès, metadata correcte (aucune pour les refus)`);
  const obtenuB = await auditsDe(b.id);
  verifier(JSON.stringify(obtenuB) === '["CREATE_OFFER:BROUILLON"]', `Offre B : ${obtenuB.join(", ")} (publication refusée non journalisée)`);
}

// ---------------------------------------------------------------- Tests publics

async function testsPublics() {
  console.log("\n— lecture publique (GET /api/job-offers)");
  const o = {
    ouverte: await insererOffre("ouverte", "PUBLIEE", "1 hour", "future"),
    aujourdhui: await insererOffre("aujourdhui", "PUBLIEE", "2 hours", "today"),
    brouillon: await insererOffre("brouillon", "BROUILLON", null, null),
    desactivee: await insererOffre("desactivee", "DESACTIVEE", "5 hours", null),
    archivee: await insererOffre("archivee", "ARCHIVEE", "6 hours", null),
    expiree: await insererOffre("expiree", "PUBLIEE", "3 hours", "yesterday"),
  };

  let r = await appel(PUBLIC, { auth: false });
  const liste = r.json?.data ?? [];
  const ids = liste.map((x) => x.id);
  verifier(r.status === 200 && r.cc === PUBLIC_CC, `Liste → ${r.status}, Cache-Control: ${r.cc}`);
  verifier(ids.includes(o.ouverte.id) && ids.includes(o.aujourdhui.id), "Contient l'offre ouverte et celle qui se termine aujourd'hui");
  verifier(![o.brouillon, o.desactivee, o.archivee, o.expiree].some((x) => ids.includes(x.id)), "Ne contient ni brouillon, ni désactivée, ni archivée, ni expirée");
  const dates = liste.map((x) => Date.parse(x.publishedAt));
  verifier(dates.every((t, i) => i === 0 || dates[i - 1] >= t), "Tri par date de publication décroissante");
  verifier(liste.every((x) => JSON.stringify(Object.keys(x)) === JSON.stringify(PUBLIC_KEYS)), "Exactement les 10 champs publics (aucun champ interne)");

  r = await appel(`${PUBLIC}/${o.ouverte.slug}`, { auth: false });
  verifier(r.status === 200 && r.cc === PUBLIC_CC && JSON.stringify(Object.keys(r.json?.data ?? {})) === JSON.stringify(PUBLIC_KEYS), `Détail d'une offre ouverte → ${r.status}, mêmes champs publics`);

  const corps404 = new Set();
  for (const slug of [o.brouillon.slug, o.desactivee.slug, o.archivee.slug, o.expiree.slug, `test-be09-public-${RUN}-inexistante`,
    encodeURIComponent("../etc"), "ABC", "a".repeat(81), "a--b"]) {
    r = await appel(`${PUBLIC}/${slug}`, { auth: false });
    corps404.add(`${r.status} ${r.texte} ${r.cc}`);
  }
  verifier(corps404.size === 1 && [...corps404][0] === '404 {"error":"Offre introuvable."} no-store',
    "Non ouvertes, inexistante et slugs mal formés → même 404, Cache-Control: no-store");

  for (const url of [PUBLIC, `${PUBLIC}/${o.ouverte.slug}`]) {
    r = await appel(`${url}?foo=1`, { auth: false });
    verifier(r.status === 400 && r.cc === "no-store", `${url.replace(BASE_URL, "")}?foo=1 → ${r.status} (attendu : 400)`);
    r = await appel(url, { method: "POST", corps: {}, auth: false });
    verifier(r.status === 405 && r.allow === "GET" && r.cc === "no-store", `POST ${url.replace(BASE_URL, "")} → ${r.status} (attendu : 405, Allow: GET)`);
  }
}

async function tests405() {
  console.log("\n— méthodes non autorisées (Admin)");
  for (const [methode, url, allow] of [
    ["PUT", ADMIN, "GET, POST"],
    ["POST", `${ADMIN}/1`, "GET, PATCH"],
    ["GET", `${ADMIN}/1/publish`, "POST"],
  ]) {
    const r = await appel(url, { method: methode, corps: methode === "GET" ? undefined : {} });
    verifier(r.status === 405 && r.allow === allow && r.cc === ADMIN_CC, `${methode} ${url.replace(BASE_URL, "")} → ${r.status} (attendu : 405, Allow: ${allow})`);
  }
}

async function deconnexion() {
  console.log("\n— déconnexion");
  const res = await fetch(`${BASE_URL}/api/admin/logout`, { method: "POST", headers: { cookie } });
  const apres = await appel(ADMIN);
  const ok = verifier(res.status === 200 && apres.status === 401 && apres.cc === ADMIN_CC, `Logout (${res.status}) puis liste Admin avec l'ancien cookie → ${apres.status} (attendu : 401)`);
  if (res.status === 200) cookie = null;
  return ok;
}

// ---------------------------------------------------------------- Lancement

let erreur = null;
try {
  await owner.connect();
  const { rows } = await owner.query("SELECT current_database() AS db");
  if (rows[0].db !== EXPECTED_DATABASE) refuse(`La connexion vise la base ${rows[0].db}, pas ${EXPECTED_DATABASE}.`);

  await testsSansSession();
  if (await connexion()) {
    const offres = await testsCreation();
    if (offres.a?.id && offres.b?.id) {
      await testsListeDetail(offres);
      await testsModificationEtActions(offres);
    }
    await testsPublics();
    await tests405();
    await deconnexion();
  }
} catch (e) {
  erreur = e;
} finally {
  // Nettoyage : UNIQUEMENT ce que le script a créé. Aucune ligne de admin_audit_log n'est supprimée.
  try {
    if (cookie) await fetch(`${BASE_URL}/api/admin/logout`, { method: "POST", headers: { cookie } }).catch(() => {});
    // Offres créées par l'API mais dont l'id n'aurait pas été lu (ex. interruption) : retrouvées par le suffixe d'exécution.
    const { rows: restes } = await owner.query("SELECT id FROM job_offer WHERE title LIKE '[TEST-BE09]%' AND title LIKE $1", [`%${RUN}%`]);
    for (const r of restes) offresCreees.add(r.id);
    const ids = [...offresCreees];

    const { rows: candidatures } = await owner.query(
      "SELECT cv_storage_key, cover_letter_storage_key FROM application WHERE job_offer_id = ANY($1::int[])",
      [ids]
    );
    let fichiers = 0;
    for (const c of candidatures) {
      for (const cle of [c.cv_storage_key, c.cover_letter_storage_key]) {
        const chemin = cle && /^(cv|cover-letters)\/[0-9a-f-]{36}\.pdf$/.test(cle) ? path.join(ROOT, cle) : null;
        if (chemin && existsSync(chemin)) {
          rmSync(chemin);
          fichiers += 1;
        }
      }
    }
    const apps = await owner.query("DELETE FROM application WHERE job_offer_id = ANY($1::int[])", [ids]);
    const offres = await owner.query("DELETE FROM job_offer WHERE id = ANY($1::int[]) AND title LIKE '[TEST-BE09]%'", [ids]);
    console.log(`\n🧹 Nettoyage : ${offres.rowCount} offre(s), ${apps.rowCount} candidature(s) et ${fichiers} fichier(s) de test supprimés (journal d'audit conservé).`);
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
