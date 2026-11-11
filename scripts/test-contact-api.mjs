// scripts/test-contact-api.mjs
// Tests manuels de l'API POST /api/contact (le serveur doit tourner : npm run dev).
// Utilisation : node scripts/test-contact-api.mjs <test>
// Tests disponibles : valide · court · inconnu · json · piege · debit · tous

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const URL_API = `${BASE_URL}/api/contact`;

const valide = {
  full_name: "Salma Test",
  email: "salma.test@example.com",
  subject: "Test de l'API contact",
  message: "Ceci est un message de test envoyé à l'API.",
};

const TESTS = {
  valide: { titre: "Message valide", attendu: 201, corps: JSON.stringify(valide) },
  court: { titre: "Message de 9 caractères", attendu: 400, corps: JSON.stringify({ ...valide, message: "123456789" }) },
  inconnu: { titre: "Champ inconnu (admin)", attendu: 400, corps: JSON.stringify({ ...valide, admin: true }) },
  json: { titre: "JSON invalide", attendu: 400, corps: "{ ceci n'est pas du JSON" },
  piege: { titre: "Champ piège rempli (robot)", attendu: 201, corps: JSON.stringify({ ...valide, website: "http://spam.example" }) },
};

async function envoyer(corps) {
  const res = await fetch(URL_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: corps });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function lancer(nom) {
  const t = TESTS[nom];
  const { status, data } = await envoyer(t.corps);
  const ok = status === t.attendu;
  console.log(`${ok ? "✅" : "❌"} ${t.titre} → ${status} (attendu : ${t.attendu})`);
  console.log("   Réponse :", JSON.stringify(data));
  return ok;
}

async function testerDebit() {
  // Envoie des messages INVALIDES (aucune ligne créée) jusqu'à recevoir 429
  console.log("Envoi de requêtes successives…");
  for (let i = 1; i <= 7; i++) {
    const { status } = await envoyer(TESTS.court.corps);
    console.log(`   Requête ${i} → ${status}`);
    if (status === 429) {
      console.log(`✅ Limitation de débit déclenchée à la requête ${i} → 429`);
      return true;
    }
  }
  console.log("❌ Aucune réponse 429 reçue");
  return false;
}

const nom = process.argv[2];
try {
  if (nom === "debit") await testerDebit();
  else if (nom === "tous") { for (const n of Object.keys(TESTS)) await lancer(n); await testerDebit(); }
  else if (TESTS[nom]) await lancer(nom);
  else console.log("Tests disponibles : valide · court · inconnu · json · piege · debit · tous");
} catch (error) {
  console.error(`❌ Impossible de joindre ${URL_API}. Le serveur tourne-t-il (npm run dev) ?`);
  console.error("  ", error.cause?.code ?? error.message);
}