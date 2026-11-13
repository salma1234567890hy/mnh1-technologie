// scripts/test-admin-auth.mjs
// Tests manuels de l'authentification Admin : /api/admin/login, /api/admin/me, /api/admin/logout
// (le serveur doit tourner : npm run dev).
// Utilisation : npm run test:admin -- <test>
//          ou : node --env-file=.env.local scripts/test-admin-auth.mjs <test>
// Tests disponibles : connexion · me · deconnexion · mauvais · verrouillage · tous
//
// Prérequis : TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD dans .env.local (compte de développement uniquement).
// Ces valeurs ne sont JAMAIS affichées (sauf l'email dans la requête SQL de déblocage de « verrouillage »).
//
// ⚠️ « verrouillage » BLOQUE le compte pendant 15 minutes : il n'est pas inclus dans « tous ».
//    Lancez-le à part, puis débloquez le compte avec la requête SQL affichée (rôle mnh_owner).
// ℹ️ « mauvais » ajoute 1 échec au compteur du compte ; la prochaine connexion réussie le remet à 0.
// ℹ️ Chaque test qui se connecte se déconnecte à la fin : aucune session active ne reste ouverte.

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_ADMIN_EMAIL;
const PASSWORD = process.env.TEST_ADMIN_PASSWORD;
const COOKIE_NAME = "mnh_admin_session";

// ---------------------------------------------------------------- Outils HTTP

async function lireReponse(res) {
  return { status: res.status, texte: await res.text(), setCookie: res.headers.get("set-cookie") };
}

async function connexion(email, password) {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return lireReponse(res);
}

async function me(cookie) {
  const res = await fetch(`${BASE_URL}/api/admin/me`, { headers: cookie ? { Cookie: cookie } : {} });
  return lireReponse(res);
}

async function deconnexion(cookie) {
  const res = await fetch(`${BASE_URL}/api/admin/logout`, {
    method: "POST",
    headers: cookie ? { Cookie: cookie } : {},
  });
  return lireReponse(res);
}

/** Analyse l'en-tête Set-Cookie : valeur du cookie de session + attributs (en minuscules). */
function analyserCookie(setCookie) {
  if (!setCookie) return null;
  const [nomValeur, ...attributs] = setCookie.split(";").map((p) => p.trim());
  const separateur = nomValeur.indexOf("=");
  if (nomValeur.slice(0, separateur) !== COOKIE_NAME) return null;
  return {
    valeur: nomValeur.slice(separateur + 1),
    attributs: attributs.map((a) => a.toLowerCase()),
  };
}

/** En-tête Cookie à renvoyer au serveur (le jeton n'est jamais affiché). */
function enTeteCookie(setCookie) {
  const cookie = analyserCookie(setCookie);
  return cookie?.valeur ? `${COOKIE_NAME}=${cookie.valeur}` : null;
}

/** Mauvais mot de passe garanti différent du vrai. */
function mauvaisMotDePasse() {
  return `${PASSWORD}-faux`;
}

// ---------------------------------------------------------------- Affichage

let reussis = 0;
let total = 0;

function verifier(condition, message) {
  total += 1;
  if (condition) reussis += 1;
  console.log(`${condition ? "✅" : "❌"} ${message}`);
  return condition;
}

/** Corps de réponse affichable (le jeton n'apparaît jamais dans un corps JSON). */
function resume(texte) {
  return texte.length > 160 ? `${texte.slice(0, 160)}…` : texte;
}

// ---------------------------------------------------------------- Tests

async function testConnexion() {
  console.log("\n— connexion");
  const r = await connexion(EMAIL, PASSWORD);
  verifier(r.status === 200, `Bons identifiants → ${r.status} (attendu : 200) · ${resume(r.texte)}`);

  const cookie = analyserCookie(r.setCookie);
  verifier(Boolean(cookie?.valeur), `Cookie ${COOKIE_NAME} reçu (valeur masquée)`);
  const a = cookie?.attributs ?? [];
  verifier(a.includes("httponly"), "Cookie HttpOnly");
  verifier(a.includes("secure"), "Cookie Secure");
  verifier(a.includes("samesite=strict"), "Cookie SameSite=Strict");

  await deconnexion(enTeteCookie(r.setCookie));
}

async function testMe() {
  console.log("\n— me");
  const login = await connexion(EMAIL, PASSWORD);
  const cookie = enTeteCookie(login.setCookie);
  if (!verifier(login.status === 200 && cookie, `Connexion préalable → ${login.status} (attendu : 200)`)) return;

  const r = await me(cookie);
  verifier(r.status === 200, `me avec le cookie → ${r.status} (attendu : 200) · ${resume(r.texte)}`);
  verifier(!/password|hash|argon/i.test(r.texte), "Réponse sans password_hash");

  const sans = await me(null);
  verifier(sans.status === 401, `me sans cookie → ${sans.status} (attendu : 401) · ${resume(sans.texte)}`);

  await deconnexion(cookie);
}

async function testDeconnexion() {
  console.log("\n— deconnexion");
  const login = await connexion(EMAIL, PASSWORD);
  const cookie = enTeteCookie(login.setCookie);
  if (!verifier(login.status === 200 && cookie, `Connexion préalable → ${login.status} (attendu : 200)`)) return;

  const r = await deconnexion(cookie);
  verifier(r.status === 200, `logout → ${r.status} (attendu : 200) · ${resume(r.texte)}`);
  verifier(/max-age=0/i.test(r.setCookie ?? ""), "Cookie supprimé (Max-Age=0)");

  const apres = await me(cookie);
  verifier(apres.status === 401, `me avec l'ancien cookie → ${apres.status} (attendu : 401)`);
}

async function testMauvais() {
  console.log("\n— mauvais");
  const mdp = await connexion(EMAIL, mauvaisMotDePasse());
  verifier(mdp.status === 401, `Mauvais mot de passe → ${mdp.status} (attendu : 401) · ${resume(mdp.texte)}`);

  const inconnu = await connexion("compte.inexistant@mnh.local", PASSWORD);
  verifier(inconnu.status === 401, `Email inconnu → ${inconnu.status} (attendu : 401) · ${resume(inconnu.texte)}`);

  verifier(mdp.texte === inconnu.texte, "Les deux réponses 401 sont identiques");
  verifier(!mdp.setCookie && !inconnu.setCookie, "Aucun cookie posé");
}

async function testVerrouillage() {
  console.log("\n— verrouillage (le compte sera bloqué 15 minutes)");

  // Point de départ connu : une connexion réussie remet le compteur à 0.
  const depart = await connexion(EMAIL, PASSWORD);
  if (!verifier(depart.status === 200, `Connexion initiale (compteur remis à 0) → ${depart.status} (attendu : 200)`)) {
    console.log("   Le compte est peut-être déjà bloqué : débloquez-le avec la requête SQL ci-dessous.");
    afficherDeblocage();
    return;
  }
  await deconnexion(enTeteCookie(depart.setCookie));

  for (let i = 1; i <= 5; i++) {
    const r = await connexion(EMAIL, mauvaisMotDePasse());
    verifier(r.status === 401, `Mauvais mot de passe n° ${i} → ${r.status} (attendu : 401)`);
  }

  const bon = await connexion(EMAIL, PASSWORD);
  verifier(bon.status === 401, `BON mot de passe après 5 échecs → ${bon.status} (attendu : 401, compte bloqué)`);
  verifier(!bon.setCookie, "Aucun cookie posé pendant le blocage");

  afficherDeblocage();
}

function afficherDeblocage() {
  // Échappement des apostrophes pour la requête SQL affichée.
  const email = EMAIL.trim().toLowerCase().replaceAll("'", "''");
  console.log("\n🔓 Pour débloquer le compte (sans changer son mot de passe), exécutez avec le rôle mnh_owner :");
  console.log(`   UPDATE admin_user SET failed_login_count = 0, locked_until = NULL WHERE email = '${email}';`);
  console.log('   Exemple : & "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe" -h localhost -U mnh_owner -d mnh_dev -c "<requête>"');
  console.log("   ⚠️ N'utilisez PAS npm run admin:reset-password : il changerait le mot de passe.");
}

// ---------------------------------------------------------------- Lancement

const TESTS = {
  connexion: testConnexion,
  me: testMe,
  deconnexion: testDeconnexion,
  mauvais: testMauvais,
  verrouillage: testVerrouillage,
};
const TOUS = ["connexion", "me", "deconnexion", "mauvais"]; // sans « verrouillage »

const nom = process.argv[2];
if (nom !== "tous" && !TESTS[nom]) {
  console.log(`Tests disponibles : ${Object.keys(TESTS).join(" · ")} · tous`);
  console.log("(« tous » = connexion, me, deconnexion, mauvais — « verrouillage » se lance à part)");
} else if (!EMAIL || !PASSWORD) {
  console.error("❌ TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD doivent être définis dans .env.local");
  console.error("   (lancez le script avec npm run test:admin -- <test>)");
  process.exitCode = 1;
} else {
  try {
    for (const n of nom === "tous" ? TOUS : [nom]) await TESTS[n]();
    console.log(`\nRésumé : ${reussis}/${total} vérifications réussies`);
    if (reussis !== total) process.exitCode = 1;
  } catch (error) {
    console.error(`❌ Impossible de joindre ${BASE_URL}. Le serveur tourne-t-il (npm run dev) ?`);
    console.error("  ", error.cause?.code ?? error.message);
    process.exitCode = 1;
  }
}
