// scripts/test-admin-applications.mjs
// Tests de la gestion des candidatures côté Admin (BE-08) :
//   GET   /api/admin/applications                       (liste)
//   GET   /api/admin/applications/[id]                  (détail)
//   PATCH /api/admin/applications/[id]/status           (changement de statut + audit)
//   GET   /api/admin/applications/[id]/cv               (téléchargement + audit)
//   GET   /api/admin/applications/[id]/cover-letter     (téléchargement + audit)
// Le serveur doit tourner : npm run dev.
// Utilisation : npm run test:admin-applications
//          ou : node --env-file=.env.local scripts/test-admin-applications.mjs
//
// SÉCURITÉ : refuse de s'exécuter si NODE_ENV=production ou si la base visée n'est pas mnh_dev.
// Prérequis : TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD dans .env.local (compte de développement uniquement).
// Ni ces valeurs, ni le cookie de session, ni aucun chemin de fichier ne sont affichés.
//
// Données : via MIGRATION_DATABASE_URL, le script crée 2 candidatures « [TEST-BE08] » (A : CV + lettre,
// B : CV seul) et 3 petits PDF dans PRIVATE_STORAGE_DIR. À la fin (même en cas d'échec), il supprime
// UNIQUEMENT ces candidatures, ces fichiers et sa propre session si elle existe encore.
// Il ne supprime JAMAIS de ligne de admin_audit_log : chaque exécution y laisse donc LOGIN, LOGOUT,
// 2 × UPDATE_APPLICATION_STATUS, DOWNLOAD_CV et DOWNLOAD_COVER_LETTER (entity_id = candidatures supprimées ;
// aucune clé étrangère ne relie le journal aux candidatures).

import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const APPS = `${BASE_URL}/api/admin/applications`;
const EMAIL = process.env.TEST_ADMIN_EMAIL;
const PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const EXPECTED_DATABASE = "mnh_dev";
const CC = "private, no-store";
const ROOT = path.resolve(process.env.PRIVATE_STORAGE_DIR || "storage/private");

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
  if (!process.env[name]) refuse(`${name} est manquant (lancez le script avec npm run test:admin-applications).`);
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
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** Éléments créés par le script (pour le nettoyage) : jamais affichés. */
const candidatures = {};
const fichiers = [];
let cookie = null;

/** Mots qui ne doivent jamais apparaître dans une réponse (chemins, noms d'origine). */
const MOTS_INTERDITS = ["storage", "cv/", "cover-letters/", "original-alice", "original-bob", ".pdf\"}"];
const fuites = (texte) => MOTS_INTERDITS.filter((m) => texte.toLowerCase().includes(m));

function petitPdf(libelle) {
  return Buffer.from(`%PDF-1.4\n% Document de test BE-08 ${libelle} ${randomUUID()}\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n`);
}

/** Écrit un PDF de test au format de nom de savePrivateFile ("<dossier>/<uuid v4>.pdf"). */
function ecrirePdf(dossier, libelle) {
  const contenu = petitPdf(libelle);
  const cle = `${dossier}/${randomUUID()}.pdf`;
  const chemin = path.join(ROOT, cle);
  mkdirSync(path.dirname(chemin), { recursive: true });
  writeFileSync(chemin, contenu, { flag: "wx" });
  fichiers.push(chemin);
  return { cle, chemin, empreinte: sha256(contenu), taille: contenu.length };
}

async function appel(url, { method = "GET", corps, type = "application/json", headers = {}, auth = true, brut = false } = {}) {
  const res = await fetch(url, {
    method,
    headers: { ...(corps !== undefined && type ? { "content-type": type } : {}), ...(auth && cookie ? { cookie } : {}), ...headers },
    body: corps === undefined ? undefined : brut ? corps : JSON.stringify(corps),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const texte = buf.toString("utf8");
  let json = null;
  try {
    json = JSON.parse(texte);
  } catch {
    /* PDF ou corps vide */
  }
  return { status: res.status, buf, texte, json, headers: Object.fromEntries(res.headers.entries()) };
}

const cacheOk = (r) => r.headers["cache-control"] === CC;

async function nombreAudits(action) {
  const { rows } = await owner.query(
    "SELECT count(*)::int AS n FROM admin_audit_log WHERE action = $1 AND entity_type = 'application' AND entity_id = ANY($2::int[])",
    [action, Object.values(candidatures)]
  );
  return rows[0].n;
}

// ---------------------------------------------------------------- Préparation

async function preparer() {
  const offre = (await owner.query("SELECT id FROM job_offer WHERE slug = 'test-stage-developpeur-web'")).rows[0];
  if (!offre) throw new Error("Offre de test introuvable : chargez d'abord db/seeds/dev_seed.sql.");

  const cvA = ecrirePdf("cv", "CV A");
  const lettreA = ecrirePdf("cover-letters", "LETTRE A");
  const cvB = ecrirePdf("cv", "CV B");

  const inserer = async (nom, cv, lettre, joursAvant) =>
    (await owner.query(
      `INSERT INTO application (job_offer_id, full_name, email, phone, cv_storage_key, cv_original_name, cv_size_bytes,
         cover_letter_storage_key, cover_letter_original_name, consent_data_processing, created_at)
       VALUES ($1, $2, $3, '+212600000000', $4, $5, $6, $7, $8, true, now() - make_interval(days => $9))
       RETURNING id`,
      [offre.id, `[TEST-BE08] ${nom}`, `${nom.toLowerCase()}_be08@mnh.local`, cv.cle, `cv-original-${nom.toLowerCase()}.pdf`, cv.taille,
       lettre?.cle ?? null, lettre ? `lettre-original-${nom.toLowerCase()}.pdf` : null, joursAvant]
    )).rows[0].id;

  candidatures.a = await inserer("Alice", cvA, lettreA, 2);
  candidatures.b = await inserer("Bob", cvB, null, 1);
  return { cvA, lettreA, cvB };
}

// ---------------------------------------------------------------- Tests

async function testsSansSession() {
  console.log("\n— sans session");
  const { a } = candidatures;
  for (const [methode, url, corps] of [
    ["GET", APPS],
    ["GET", `${APPS}/${a}`],
    ["PATCH", `${APPS}/${a}/status`, { status: "EN_COURS_EXAMEN" }],
    ["GET", `${APPS}/${a}/cv`],
    ["GET", `${APPS}/${a}/cover-letter`],
  ]) {
    const r = await appel(url, { method: methode, corps, auth: false });
    verifier(r.status === 401 && cacheOk(r), `${methode} ${url.replace(BASE_URL, "")} sans cookie → ${r.status} (attendu : 401)`);
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

async function testsListe() {
  console.log("\n— liste (GET /api/admin/applications)");
  const noms = (r) => (r.json?.data?.items ?? []).map((i) => i.fullName.replace("[TEST-BE08] ", ""));

  let r = await appel(APPS);
  const d = r.json?.data;
  verifier(r.status === 200 && cacheOk(r) && d?.page === 1 && d?.pageSize === 20 && typeof d?.total === "number",
    `Sans paramètre → ${r.status}, page ${d?.page}, pageSize ${d?.pageSize}, total ${d?.total}`);

  r = await appel(`${APPS}?q=TEST-BE08`);
  verifier(r.status === 200 && JSON.stringify(noms(r)) === '["Bob","Alice"]', `?q=TEST-BE08 (tri récent) → ${JSON.stringify(noms(r))}`);
  r = await appel(`${APPS}?q=TEST-BE08&sort=oldest`);
  verifier(r.status === 200 && JSON.stringify(noms(r)) === '["Alice","Bob"]', `&sort=oldest → ${JSON.stringify(noms(r))}`);
  r = await appel(`${APPS}?q=${encodeURIComponent("alice_be08")}`);
  verifier(r.status === 200 && r.json?.data?.total === 1 && r.json.data.items[0].hasCoverLetter === true, `?q=alice_be08 (« _ » littéral) → ${r.json?.data?.total} résultat`);
  r = await appel(`${APPS}?q=TEST-BE08&status=EN_ATTENTE&offerId=${r.json?.data?.items?.[0]?.offer?.id ?? 1}`);
  verifier(r.status === 200 && r.json?.data?.total === 2, `Filtres status + offerId → ${r.json?.data?.total} résultat(s) (attendu : 2)`);

  const pages = [];
  for (const p of [1, 2, 3]) {
    const x = await appel(`${APPS}?q=TEST-BE08&pageSize=1&page=${p}`);
    pages.push(`${x.json?.data?.items?.length}/${x.json?.data?.total}/${x.json?.data?.totalPages}`);
  }
  verifier(pages.join(" ") === "1/2/2 1/2/2 0/2/2", `Pagination pageSize=1 (éléments/total/pages) → ${pages.join(" · ")}`);

  for (const q of ["status=INCONNU", "page=0", "pageSize=101", "sort=abc", "foo=1"]) {
    r = await appel(`${APPS}?${q}`);
    verifier(r.status === 400 && cacheOk(r) && r.json?.error === "Paramètres invalides.", `?${q} → ${r.status} (attendu : 400)`);
  }
}

async function testsDetail() {
  console.log("\n— détail (GET /api/admin/applications/[id])");
  const r = await appel(`${APPS}/${candidatures.a}`);
  verifier(
    r.status === 200 && cacheOk(r) && JSON.stringify(r.json?.data?.files?.coverLetter) === '{"present":true}' && r.json?.data?.files?.cv?.present === true,
    `Candidature A → ${r.status}, fichiers ${JSON.stringify(r.json?.data?.files)}`
  );
  verifier(fuites(r.texte).length === 0, `Aucun chemin ni nom de fichier d'origine dans la réponse (${fuites(r.texte).join(", ") || "aucun"})`);
  for (const [chemin, attendu] of [["999999", 404], ["abc", 400], ["-1", 400], [`${candidatures.a}?foo=1`, 400]]) {
    const x = await appel(`${APPS}/${chemin}`);
    verifier(x.status === attendu && cacheOk(x), `/${chemin} → ${x.status} (attendu : ${attendu})`);
  }
}

async function testsStatut() {
  console.log("\n— statut (PATCH /api/admin/applications/[id]/status)");
  const { a, b } = candidatures;
  const url = (id) => `${APPS}/${id}/status`;

  for (const [libelle, options, attendu] of [
    ["Origin étranger", { corps: { status: "EN_COURS_EXAMEN" }, headers: { origin: "https://site-pirate.com" } }, 403],
    ["Content-Type text/plain", { corps: { status: "EN_COURS_EXAMEN" }, type: "text/plain" }, 415],
    ["Corps > 1024 octets", { corps: { status: "EN_COURS_EXAMEN", x: "a".repeat(1100) } }, 413],
    ["JSON invalide", { corps: "{ pas du json", brut: true }, 400],
    ["Statut inconnu", { corps: { status: "VALIDEE" } }, 400],
    ["Champ en trop (note)", { corps: { status: "ACCEPTEE", note: "ok" } }, 400],
  ]) {
    const r = await appel(url(a), { method: "PATCH", ...options });
    verifier(r.status === attendu && cacheOk(r), `${libelle} → ${r.status} (attendu : ${attendu})`);
  }
  let r = await appel(url(999999), { method: "PATCH", corps: { status: "ACCEPTEE" } });
  verifier(r.status === 404, `id inexistant → ${r.status} (attendu : 404)`);

  r = await appel(url(a), { method: "PATCH", corps: { status: "EN_COURS_EXAMEN" } });
  verifier(r.status === 200 && r.json?.data?.from === "EN_ATTENTE" && r.json?.data?.to === "EN_COURS_EXAMEN", `EN_ATTENTE → EN_COURS_EXAMEN → ${r.status} ${JSON.stringify(r.json?.data)}`);
  r = await appel(url(a), { method: "PATCH", corps: { status: "ACCEPTEE" } });
  verifier(r.status === 200 && r.json?.data?.to === "ACCEPTEE", `EN_COURS_EXAMEN → ACCEPTEE → ${r.status}`);
  r = await appel(url(a), { method: "PATCH", corps: { status: "REFUSEE" } });
  verifier(r.status === 409 && r.json?.current === "ACCEPTEE" && JSON.stringify(r.json?.allowed) === "[]", `Statut final ACCEPTEE → REFUSEE → ${r.status} (attendu : 409)`);
  r = await appel(url(a), { method: "PATCH", corps: { status: "EN_ATTENTE" } });
  verifier(r.status === 409, `Retour vers EN_ATTENTE → ${r.status} (attendu : 409)`);
  r = await appel(url(b), { method: "PATCH", corps: { status: "EN_ATTENTE" } });
  verifier(r.status === 409 && r.json?.error === "La candidature a déjà ce statut.", `Même statut → ${r.status} (attendu : 409)`);

  const { rows } = await owner.query(
    "SELECT metadata FROM admin_audit_log WHERE action = 'UPDATE_APPLICATION_STATUS' AND entity_type = 'application' AND entity_id = ANY($1::int[]) ORDER BY id",
    [[a, b]]
  );
  const transitions = rows.map((x) => `${x.metadata?.from}→${x.metadata?.to}`);
  verifier(transitions.join(" ") === "EN_ATTENTE→EN_COURS_EXAMEN EN_COURS_EXAMEN→ACCEPTEE",
    `Audit : exactement 2 lignes avec { from, to }, aucune pour les refus (${transitions.join(", ")})`);

  r = await appel(`${APPS}/${a}`);
  verifier(r.json?.data?.status === "ACCEPTEE" && typeof r.json?.data?.reviewedBy?.id === "number", `Le détail reflète le nouveau statut (${r.json?.data?.status})`);
}

async function testsTelechargements({ cvA, lettreA, cvB }) {
  console.log("\n— téléchargements (GET …/cv et …/cover-letter)");
  const { a, b } = candidatures;
  const entetesOk = (r, nom, taille) =>
    r.headers["content-type"] === "application/pdf" &&
    r.headers["content-disposition"] === `attachment; filename="${nom}"` &&
    r.headers["content-length"] === String(taille) &&
    r.headers["x-content-type-options"] === "nosniff" &&
    r.headers["content-security-policy"] === "default-src 'none'; sandbox" &&
    cacheOk(r);

  for (const [chemin, fichier, nom, libelle] of [
    ["cv", cvA, `CV_candidature_${a}.pdf`, "CV de A"],
    ["cover-letter", lettreA, `Lettre_candidature_${a}.pdf`, "Lettre de A"],
  ]) {
    const r = await appel(`${APPS}/${a}/${chemin}`);
    verifier(r.status === 200 && entetesOk(r, nom, fichier.taille), `${libelle} → ${r.status}, en-têtes exacts (${r.headers["content-disposition"]})`);
    verifier(sha256(r.buf) === fichier.empreinte, `${libelle} : contenu identique (SHA-256)`);
    verifier(fuites(JSON.stringify(r.headers)).length === 0, `${libelle} : aucun chemin ni nom d'origine dans les en-têtes`);
  }

  let r = await appel(`${APPS}/${b}/cover-letter`);
  verifier(r.status === 404 && r.json?.error === "Fichier introuvable.", `Lettre de B (absente) → ${r.status} (attendu : 404)`);
  r = await appel(`${APPS}/999999/cv`);
  verifier(r.status === 404, `CV d'une candidature inexistante → ${r.status} (attendu : 404)`);
  r = await appel(`${APPS}/abc/cv`);
  verifier(r.status === 400, `id=abc → ${r.status} (attendu : 400)`);

  const avant = await nombreAudits("DOWNLOAD_CV");
  rmSync(cvB.chemin);
  r = await appel(`${APPS}/${b}/cv`);
  verifier(r.status === 404 && (await nombreAudits("DOWNLOAD_CV")) === avant, `CV de B supprimé du disque → ${r.status} (attendu : 404), aucun audit ajouté`);

  const cv = await nombreAudits("DOWNLOAD_CV");
  const lettre = await nombreAudits("DOWNLOAD_COVER_LETTER");
  verifier(cv === 1 && lettre === 1, `Audit : ${cv} DOWNLOAD_CV et ${lettre} DOWNLOAD_COVER_LETTER (attendu : 1 et 1)`);
}

async function tests405() {
  console.log("\n— méthodes non autorisées");
  const { a } = candidatures;
  for (const [methode, url, allow] of [
    ["POST", APPS, "GET"],
    ["POST", `${APPS}/${a}`, "GET"],
    ["GET", `${APPS}/${a}/status`, "PATCH"],
    ["POST", `${APPS}/${a}/status`, "PATCH"],
    ["POST", `${APPS}/${a}/cv`, "GET"],
    ["POST", `${APPS}/${a}/cover-letter`, "GET"],
  ]) {
    const r = await appel(url, { method: methode });
    verifier(r.status === 405 && r.headers.allow === allow && cacheOk(r), `${methode} ${url.replace(BASE_URL, "")} → ${r.status} (attendu : 405, Allow: ${allow})`);
  }
}

async function deconnexion() {
  console.log("\n— déconnexion");
  const res = await fetch(`${BASE_URL}/api/admin/logout`, { method: "POST", headers: { cookie } });
  const apres = await appel(APPS);
  const ok = verifier(res.status === 200 && apres.status === 401 && cacheOk(apres), `Logout (${res.status}) puis liste avec l'ancien cookie → ${apres.status} (attendu : 401)`);
  if (res.status === 200) cookie = null;
  return ok;
}

// ---------------------------------------------------------------- Lancement

let erreur = null;
try {
  await owner.connect();
  const { rows } = await owner.query("SELECT current_database() AS db");
  if (rows[0].db !== EXPECTED_DATABASE) refuse(`La connexion vise la base ${rows[0].db}, pas ${EXPECTED_DATABASE}.`);

  const pdfs = await preparer();
  await testsSansSession();
  if (await connexion()) {
    await testsListe();
    await testsDetail();
    await testsStatut();
    await testsTelechargements(pdfs);
    await tests405();
    await deconnexion();
  }
} catch (e) {
  erreur = e;
} finally {
  // Nettoyage : UNIQUEMENT ce que le script a créé. Aucune ligne de admin_audit_log n'est supprimée.
  try {
    if (cookie) await fetch(`${BASE_URL}/api/admin/logout`, { method: "POST", headers: { cookie } }).catch(() => {});
    const ids = Object.values(candidatures);
    const apps = ids.length
      ? await owner.query("DELETE FROM application WHERE id = ANY($1::int[]) AND full_name LIKE '[TEST-BE08]%'", [ids])
      : { rowCount: 0 };
    let supprimes = 0;
    for (const f of fichiers) {
      if (existsSync(f)) {
        rmSync(f);
        supprimes += 1;
      }
    }
    console.log(`\n🧹 Nettoyage : ${apps.rowCount} candidature(s) de test et ${supprimes} fichier(s) de test supprimés (journal d'audit conservé).`);
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
