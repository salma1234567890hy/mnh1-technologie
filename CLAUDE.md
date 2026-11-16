@AGENTS.md

# CLAUDE.md — Projet MNH Technologie (Refonte du site)

## Contexte
Refonte complète du site de **MNH Technologie** (agence web, mobile & IA, Casablanca).
Le travail a commencé avec GitHub Copilot, puis Antigravity ; il continue maintenant avec Claude Code.
Le code existant peut contenir des conventions issues de ces outils : **les analyser et les respecter**, ne pas tout réécrire.

Stack : Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn / Base UI · Framer Motion · lucide-react · PostgreSQL + node-postgres (pg), SQL natif, aucun ORM.

## Document de référence
La spécification visuelle complète se trouve dans `docs/design-spec.md`
(direction artistique validée : **« Néon Subtil » — Dark-Light Hybride**).
Toujours la lire avant de créer ou modifier un composant visuel.

## Règles de travail
1. **Analyser avant d'agir** : inspecter la structure, le framework, le système de style et les conventions existantes avant toute implémentation.
2. **Planifier d'abord** : pour toute tâche non triviale, proposer un plan court (fichiers créés/modifiés, approche) et attendre ma validation.
3. **Périmètre strict** : ne modifier QUE ce qui est demandé. Ne jamais toucher aux autres sections, pages ou routes sans demande explicite.
4. **Réutiliser l'existant** : mêmes technologies, mêmes conventions de nommage, aucune dépendance inutile.
5. **Composants réutilisables**, HTML sémantique, accessibilité (aria, navigation clavier, focus visible, `prefers-reduced-motion`).
6. **Code complet** : livrer des fichiers complets et fonctionnels, pas des extraits partiels.
7. **Résumé final** : à la fin de chaque tâche, lister les fichiers créés/modifiés et comment tester.
8. En cas de contradiction entre ma demande et la spec, **ma demande la plus récente l'emporte** — mais signaler la contradiction.
9. Le projet est dans `C:\dev\mnh-technologie` (jamais dans OneDrive).
10. Toute page Admin doit appeler `requireAdminPage()` (`lib/admin/require-admin-page.ts`) elle-même, sous `<Suspense>` (le layout seul ne suffit pas). Les routes `/api/admin/*` gardent `requireAdmin()`.
11. Code client : `lib/client/` et `lib/types/` ; jamais d'import d'un module `server-only`, sauf `import type`.
12. **Aucun texte visible en dur dans les composants du site public** : tout passe par les dictionnaires `lib/i18n/dictionaries/fr.ts` (référence, le type `Dictionary` en est dérivé) et `en.ts`. Server Components : `getDictionary()` (`lib/i18n/get-dictionary.ts`) ; Client Components : `useI18n()` (`components/i18n/I18nProvider.tsx`). Liens internes : toujours `localizedHref(locale, href)` (`lib/i18n/config.ts`). L'Admin reste en français (non traduit).

## Design tokens (résumé — détail dans docs/design-spec.md)

### Couleurs
| Token | Hex | Usage |
|---|---|---|
| --mnh-black | #0A0A0A | Fond sections sombres |
| --mnh-dark-elevated | #141414 | Cartes / navbar / panneaux sur fond sombre |
| --mnh-dark-border | #262626 | Bordures en contexte sombre |
| --mnh-light | #F9FAFB | Fond sections claires (et fond du body) |
| --mnh-light-border | #E2E8F0 | Bordures en contexte clair (cartes, champs) |
| --mnh-white | #FFFFFF | Cartes sur fond clair |
| --mnh-brand | #67B02E | Vert officiel : logo, lignes, icônes, accents structurels ; texte sur fond SOMBRE uniquement |
| --mnh-brand-text | #3F7A1C | Texte vert sur fond CLAIR (étiquettes, mot coloré des H2, liens « En savoir plus », dates) — 5,23:1 sur blanc, à valider avec l'encadrant |
| --mnh-accent | #4ADE80 | Vert vif : CTA, hover, lueurs, état actif |
| --mnh-cyan | #22D3EE | Très rare : tags portfolio uniquement, jamais pour un CTA |
| --mnh-text-white | #F1F5F9 | Texte principal sur sombre |
| --mnh-text-muted-dark | #94A3B8 | Texte secondaire sur sombre |
| --mnh-text-dark | #0F172A | Texte principal sur clair |
| --mnh-text-muted-light | #64748B | Texte secondaire sur clair |

Les variables shadcn (`--background`, `--foreground`, `--primary`, `--border`, `--ring`…) pointent vers ces tokens dans `app/globals.css` : ne pas leur redonner de valeurs propres.

### Règle de contraste (obligatoire, ≥ 4,5:1 pour le texte normal)
- Texte vert sur fond clair = `text-mnh-brand-text` (#3F7A1C).
- `#67B02E` (`mnh-brand`) **jamais** en texte sur fond clair (2,68:1 sur blanc).
- Gris `#64748B` (`mnh-text-muted-light`) **jamais** sur fond sombre → utiliser `mnh-text-muted-dark` (#94A3B8).

### Typographie
- Titres : **Space Grotesk** (Google Fonts), fallback `system-ui, sans-serif`
- Texte : **DM Sans** (Google Fonts), fallback `system-ui, sans-serif`
- H1 64/36px · H2 48/28px · H3 24/20px · Body 17/15px · CTA 15/14px weight 600

### Layout
- Container : max-width 1280px, padding horizontal 24px (16px mobile)
- Sections : padding vertical 120px desktop / 96px tablette / 72px mobile
- Breakpoints : sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536

### Animations
- Easing standard : `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Animations au scroll, une seule fois, subtiles (Framer Motion)
- Transitions hover : 200–400ms

### Rythme des sections (page d'accueil)
Navbar (transparent → sombre flouté) · Hero (sombre) · Clients (sombre) · Pourquoi MNH (clair) · Services (clair) · Portfolio (sombre) · Équipe (clair) · Témoignages (sombre) · Blog (clair) · CTA final (sombre) · Footer (sombre)

## Avancement de la refonte

### Backend — BE-01 à BE-09 : terminé (sauf BE-04 chatbot, reporté)
PostgreSQL + `pg` (migrations SQL, rôle applicatif), `POST /api/contact`, `POST /api/applications` (PDF privés), authentification Admin (argon2id, sessions, verrouillage), analytics + dashboard Admin (BE-07), candidatures Admin (BE-08), offres Admin + lecture publique (BE-09).

### Frontend — FE-01 : terminé
- Charte « Néon Subtil » en tokens (`app/globals.css`, variables shadcn alignées, contrastes AA)
- Layouts séparés (FE-02 : deux layouts racines) : public `app/[lang]/layout.tsx` (`<html lang>`, polices, dictionnaire) + `app/[lang]/(public)/layout.tsx` (skip link, header, footer) · Admin `app/admin/layout.tsx` (`<html lang="fr">`, noindex) · 404 / erreur publiques traduites dans `app/[lang]/(public)/` (avec header et footer), Admin dans `app/admin/`
- Composants partagés `components/shared/` : `Container`, `SectionHeader` (prop `tone`), `Reveal`, `SkipLink`
- Client API typé `lib/client/` (`apiFetch`, fonctions par route) + types JSON `lib/types/api.ts`
- Protection serveur de l'Admin : `getCurrentAdmin()` (`lib/auth/session.ts`), `requireAdminPage()`, redirections `/admin` ↔ `/admin/login`

### Page d'accueil et chrome
- [x] Navbar — barre flottante arrondie (`components/layout/SiteHeader.tsx`, `MobileNavigation.tsx`, `HeaderCta.tsx`, `LanguageSwitcher.tsx`, `navigation.ts`) — hamburger sous `xl` (1280px), gap des liens 24px à toutes les largeurs ; nom « MNH TECHNOLOGIE » à côté du logo (masqué < 360px et entre 1280 et 1439px)
- [x] Recherche — command palette ⌘K / Ctrl+K / « / » (`components/search/*`, `lib/search/*` : index par providers, extensible au blog)
- [x] Hero — vidéo en arrière-plan (`components/home/HeroSection.tsx` serveur + `HeroVideo` / `HeroCounter` clients, `HeroReveal` en CSS pour le LCP ; vidéos dans `public/videos/`, variants partagés dans `lib/motion/variants.ts`)
- [ ] Clients
- [ ] Pourquoi MNH
- [ ] Services
- [ ] Portfolio
- [ ] Équipe
- [ ] Témoignages
- [ ] Blog
- [ ] CTA final
- [x] Footer — carte flottante + signature « MNH » (`components/layout/SiteFooter.tsx` serveur, îlots clients dans `components/layout/footer/`, contenu dans `footer-config.ts`, glyphes dans `lib/brand/glyphs.ts`)

## Points à valider avec l'encadrant
- **Langues (FE-02, provisoire)** : fr + en, **français par défaut**, URL « option B » (français sans préfixe, anglais en `/en`), cookie `mnh_lang` posé par le sélecteur — tout est dans `lib/i18n/config.ts` (`DEFAULT_LOCALE`). Traductions anglaises du Hero, des services, des projets et de l'équipe à relire.
- **Chiffres du Hero** : 3+, 25+, 100+ (ans d'expertise, clients, projets) — à confirmer.
- **Vert texte `#3F7A1C`** (`--mnh-brand-text`) pour le texte vert sur fond clair.
- **Rouge des erreurs** : aucun rouge dans la charte (`--destructive: #c0392b`, `red-300` / `red-400` dans le footer).
- **Consentement aux cookies de suivi** (cookie `mnh_vid`) : `trackPageView()` existe dans `lib/client/api.ts` mais n'est branché sur aucune page en attendant.

## Notes pour les tâches à venir
- **Multilingue (FE-02)** : structure `app/[lang]/(public)/…` ; `proxy.ts` réécrit les URL sans préfixe vers `/fr`, redirige `/fr/…` (308) et applique le cookie `mnh_lang` ; `GET /language?lang=&path=` (`app/language/route.ts`) pose le cookie et redirige (303). Une **nouvelle page publique** se crée dans `app/[lang]/(public)/<page>/page.tsx` — et son `status` passe de `"planned"` à `"live"` dans `components/layout/navigation.ts` (source unique : préchargement des liens, badge « Bientôt » de la recherche) — avec ses textes dans les deux dictionnaires et `generateMetadata` → `alternates: localizedAlternates(lang, "/<page>")` (hreflang). Le matcher du proxy exclut `/admin`, `/api`, `/_next`, `/brand`, `/videos`, `/language` et les fichiers avec extension : un nouveau dossier de `public/` doit y être ajouté.
- **404 avec deux layouts racines (comportement de Next 16 constaté en FE-02)** : quand une page appelle `notFound()` (catch-all `[...rest]` public ou Admin), le serveur renvoie bien **404 + `noindex`**, mais un HTML minimal (`<html id="__next_error__">`) ; c'est le **navigateur** qui affiche la 404 (avec header et footer, dans la bonne langue) à partir de la charge RSC. `global-not-found` et une frontière `<Suspense>` ont été essayés sans succès (le second donne un statut 200 : à ne pas faire). À revérifier après `npm run build`.
- **Page Contact** : le formulaire du footer enregistre l'email saisi dans `sessionStorage` (clé `mnh:prefill-email`, jamais dans l'URL) puis redirige vers `/contact`. La page Contact doit appeler `consumePrefillEmail()` de `lib/contact/prefill.ts` **après le montage** (composant client, dans un `useEffect`) pour pré-remplir son champ email ; la valeur est supprimée à la lecture. Utiliser aussi `isValidEmail()` du même module.
- **Services** : source unique `lib/content/services.ts` (slugs et ancres `/services#…`) ; noms et descriptions dans les dictionnaires (`dict.services[slug]`) ; utilisée par la recherche et le footer — la future page Services doit exposer ces mêmes ancres (`id="web-development"`, etc.).
- **Coordonnées / horaires / réseaux** : `components/layout/footer/footer-config.ts`.

## Principes anti-générique (obligatoires)
- Pas de dégradés arc-en-ciel, pas de blobs SVG, pas d'illustrations flat génériques
- Pas de Lorem ipsum : uniquement le texte réel du site
- Pas de faux chiffres (compteurs réels : 3, 25, 100)
- Un seul mot coloré par titre, jamais de gradient sur le texte
- Pas de preloader, pas de parallax excessif
- Cohérence stricte : mêmes radius, ombres et transitions partout
- Espaces blancs généreux

## Ressources
- Logo officiel : https://www.mnhtechnologie.com/assets/img/icon/LG%20BL.png
- Site actuel : https://www.mnhtechnologie.com
