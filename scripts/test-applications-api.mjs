// scripts/test-applications-api.mjs
// Tests manuels de l'API POST /api/applications (le serveur doit tourner : npm run dev).
// Utilisation : node --env-file=.env.local scripts/test-applications-api.mjs <test>
//          ou : npm run test:applications -- <test>
// Tests disponibles : valide · fauxpdf · tropgros · sansconsentement · sanscv · offreinexistante · brouillon · tous
//
// Prérequis : les données de test (db/seeds/dev_seed.sql) doivent être chargées dans la base.
// Les fichiers PDF sont générés en mémoire : aucun fichier à préparer.
//
// ⚠️ Limitation de débit, par adresse IP (compteur en mémoire, remis à zéro au redémarrage du serveur) :
//    - npm run dev (development) : 50 requêtes par heure → « tous » (7 requêtes) passe sans 429 ;
//    - next start (production)   : 5 requêtes par heure  → les 2 dernières requêtes de « tous » recevront 429.
//    Si vous enchaînez beaucoup de lancements, redémarrez npm run dev pour remettre le compteur à zéro.
//
// Remarque : le test « valide » crée une vraie candidature en base et un vrai fichier
// dans PRIVATE_STORAGE_DIR (storage/private par défaut).

import pg from "pg";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const URL_API = `${BASE_URL}/api/applications`;

const MO = 1024 * 1024;

/** PDF factice de la taille demandée : commence par la signature "%PDF-" et finit par "%%EOF". */
function genererPdf(tailleOctets, nom = "cv.pdf") {
  const debut = new TextEncoder().encode("%PDF-1.4\n");
  const fin = new TextEncoder().encode("\n%%EOF\n");
  const octets = new Uint8Array(tailleOctets).fill(0x20); // espaces
  octets.set(debut, 0);
  octets.set(fin, tailleOctets - fin.length);
  return new File([octets], nom, { type: "application/pdf" });
}

/** Faux PDF : en réalité un exécutable Windows (signature "MZ"), avec un nom et un type MIME de PDF. */
function genererFauxPdf() {
  const octets = new Uint8Array(1024);
  octets.set(new TextEncoder().encode("MZ"), 0);
  return new File([octets], "cv.pdf", { type: "application/pdf" });
}

/** Identifiants des offres de test, lus avec le rôle applicatif mnh_app (DATABASE_URL). */
async function lireOffresDeTest() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL est manquant : lancez le script avec --env-file=.env.local");
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(
      "SELECT id, slug FROM job_offer WHERE slug = ANY($1)",
      [["test-stage-developpeur-web", "test-offre-brouillon"]]
    );
    const publiee = rows.find((r) => r.slug === "test-stage-developpeur-web");
    const brouillon = rows.find((r) => r.slug === "test-offre-brouillon");
    if (!publiee || !brouillon) {
      throw new Error("Offres de test introuvables : chargez d'abord db/seeds/dev_seed.sql (avec mnh_owner).");
    }
    return { publiee: publiee.id, brouillon: brouillon.id };
  } finally {
    await client.end();
  }
}

/** Formulaire de base valide ; `modifs` remplace ou retire (undefined) des champs texte. */
function construireFormulaire(offreId, { modifs = {}, cv = genererPdf(100 * 1024) } = {}) {
  const champs = {
    job_offer_id: String(offreId),
    full_name: "[TEST] Candidat script",
    email: "candidat.script@mnh.local",
    phone: "+212 600 00 00 00",
    message: "Candidature envoyée par scripts/test-applications-api.mjs.",
    consent: "on",
    ...modifs,
  };
  const formulaire = new FormData();
  for (const [nom, valeur] of Object.entries(champs)) {
    if (valeur !== undefined) formulaire.append(nom, valeur);
  }
  if (cv) formulaire.append("cv", cv);
  return formulaire;
}

const TESTS = {
  valide: {
    titre: "CV PDF valide de 4 Mo",
    attendu: 201,
    formulaire: (o) => construireFormulaire(o.publiee, { cv: genererPdf(4 * MO) }),
  },
  fauxpdf: {
    titre: "Exécutable « MZ » nommé cv.pdf",
    attendu: 400,
    formulaire: (o) => construireFormulaire(o.publiee, { cv: genererFauxPdf() }),
  },
  tropgros: {
    titre: "PDF de 6 Mo",
    attendu: 400,
    formulaire: (o) => construireFormulaire(o.publiee, { cv: genererPdf(6 * MO) }),
  },
  sansconsentement: {
    titre: "Consentement absent",
    attendu: 400,
    formulaire: (o) => construireFormulaire(o.publiee, { modifs: { consent: undefined } }),
  },
  sanscv: {
    titre: "Aucun fichier cv",
    attendu: 400,
    formulaire: (o) => construireFormulaire(o.publiee, { cv: null }),
  },
  offreinexistante: {
    titre: "Offre inexistante (job_offer_id 999999)",
    attendu: 404,
    formulaire: () => construireFormulaire(999999),
  },
  brouillon: {
    titre: "Offre BROUILLON (test-offre-brouillon)",
    attendu: 404,
    formulaire: (o) => construireFormulaire(o.brouillon),
  },
};

async function envoyer(formulaire) {
  // Pas d'en-tête Content-Type : fetch ajoute lui-même multipart/form-data avec la bonne frontière.
  const res = await fetch(URL_API, { method: "POST", body: formulaire });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function lancer(nom, offres) {
  const t = TESTS[nom];
  const { status, data } = await envoyer(t.formulaire(offres));
  const ok = status === t.attendu;
  console.log(`${ok ? "✅" : "❌"} ${t.titre} → ${status} (attendu : ${t.attendu})`);
  console.log("   Réponse :", JSON.stringify(data));
  if (status === 429) {
    console.log("   ⚠️ Limite de débit atteinte (50 / heure en dev, 5 en production) : redémarrez le serveur puis relancez ce test.");
  }
  return ok;
}

async function lancerTous(offres) {
  const noms = Object.keys(TESTS);
  console.log(`ℹ️ « tous » envoie ${noms.length} requêtes. Limite : 50 / heure sous npm run dev, 5 / heure en production.`);
  console.log("   En production (next start), les 2 dernières recevront donc 429.");
  console.log("   Sous npm run dev, redémarrez le serveur si la limite de 50 est atteinte.\n");
  let reussis = 0;
  for (const nom of noms) {
    if (await lancer(nom, offres)) reussis += 1;
  }
  console.log(`\nRésumé : ${reussis}/${noms.length} réussis`);
}

const nom = process.argv[2];
if (nom !== "tous" && !TESTS[nom]) {
  console.log(`Tests disponibles : ${Object.keys(TESTS).join(" · ")} · tous`);
} else {
  let offres;
  try {
    offres = await lireOffresDeTest();
  } catch (error) {
    console.error("❌ Lecture des offres de test impossible :", error.message);
    process.exitCode = 1;
  }
  if (offres) {
    try {
      if (nom === "tous") await lancerTous(offres);
      else await lancer(nom, offres);
    } catch (error) {
      console.error(`❌ Impossible de joindre ${URL_API}. Le serveur tourne-t-il (npm run dev) ?`);
      console.error("  ", error.cause?.code ?? error.message);
      process.exitCode = 1;
    }
  }
}
