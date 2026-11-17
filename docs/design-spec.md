# Spécification Visuelle — Page d'Accueil MNH Technologie

**Direction artistique validée : Néon Subtil (Dark-Light Hybride)**

> Ce document est une référence de design pour l'implémentation.

---

## Palette de couleurs officielle

| Token | Hex | Utilisation |
|---|---|---|
| `--mnh-black` | `#0A0A0A` | Fond principal des sections sombres |
| `--mnh-dark-elevated` | `#141414` | Cartes, navbars, éléments élevés sur fond sombre |
| `--mnh-dark-border` | `#262626` | Bordures et séparateurs en contexte sombre |
| `--mnh-light` | `#F9FAFB` | Fond principal des sections claires |
| `--mnh-white` | `#FFFFFF` | Cartes et surfaces sur fond clair |
| `--mnh-brand` | `#67B02E` | Vert officiel MNH — logo, identité, accents structurels |
| `--mnh-accent` | `#4ADE80` | Vert vif — CTAs, highlights interactifs, lueurs |
| `--mnh-cyan` | `#22D3EE` | Accent tertiaire — usage très parcimonieux (badges, tags) |
| `--mnh-text-white` | `#F1F5F9` | Texte principal sur fond sombre |
| `--mnh-text-muted-dark` | `#94A3B8` | Texte secondaire sur fond sombre |
| `--mnh-text-dark` | `#0F172A` | Texte principal sur fond clair |
| `--mnh-text-muted-light` | `#64748B` | Texte secondaire sur fond clair |

### Règles d'utilisation des couleurs

> **IMPORTANT**
>
> - Le vert brand `#67B02E` est réservé au logo, aux lignes structurelles, aux bordures d'accentuation et aux éléments identitaires.
> - **Contraste (décision FE-01, à valider avec l'encadrant)** : `#67B02E` n'atteint que 2,68:1 sur blanc. Tout **texte** vert sur fond **clair** (étiquettes, mot coloré des H2, liens, dates) utilise `#3F7A1C` (`--mnh-brand-text`, 5,23:1). `#67B02E` reste pour le texte sur fond **sombre** et pour les éléments non textuels (traits, icônes, bordures). Cette règle prime sur toute mention de `#67B02E` en couleur de texte dans les sections claires ci-dessous.
> - Le vert accent `#4ADE80` est utilisé pour les éléments interactifs : boutons CTA, liens hover, lueurs, indicateurs actifs.
> - Le cyan `#22D3EE` est utilisé avec parcimonie : uniquement pour les tags de catégorie dans le portfolio et un accent ponctuel dans les témoignages. **Jamais pour les CTA.**

---

## Typographies

| Token | Police | Source | Fallback |
|---|---|---|---|
| `--font-heading` | Space Grotesk | Google Fonts | `system-ui, sans-serif` |
| `--font-body` | DM Sans | Google Fonts | `system-ui, sans-serif` |

### Échelle typographique

| Élément | Police | Desktop | Mobile | Poids | Interligne | Tracking |
|---|---|---|---|---|---|---|
| H1 (Hero) | Space Grotesk | 64px / 4rem | 36px / 2.25rem | 700 | 1.1 | -0.02em |
| H2 (Section) | Space Grotesk | 48px / 3rem | 28px / 1.75rem | 700 | 1.15 | -0.015em |
| H3 (Card title) | Space Grotesk | 24px / 1.5rem | 20px / 1.25rem | 600 | 1.3 | -0.01em |
| H6 (Label) | DM Sans | 14px / 0.875rem | 12px / 0.75rem | 600 | 1.4 | 0.08em |
| Body | DM Sans | 17px / 1.0625rem | 15px / 0.9375rem | 400 | 1.7 | 0 |
| Body small | DM Sans | 14px / 0.875rem | 13px | 400 | 1.6 | 0 |
| CTA Button | DM Sans | 15px / 0.9375rem | 14px | 600 | 1 | 0.01em |

---

## Espacements globaux

| Élément | Desktop | Tablette | Mobile |
|---|---|---|---|
| Section padding vertical | 120px (`py-30`) | 96px (`py-24`) | 72px (`py-18`) |
| Container max-width | 1280px (`max-w-7xl`) | 100% - 48px | 100% - 32px |
| Container padding horizontal | 24px (`px-6`) | 24px | 16px (`px-4`) |
| Gap grille principale | 32px (`gap-8`) | 24px | 20px |
| Espace titre section → contenu | 64px (`mb-16`) | 48px | 40px |

## Breakpoints

| Nom | Largeur | Usage |
|---|---|---|
| sm | 640px | Mobile paysage |
| md | 768px | Tablette |
| lg | 1024px | Desktop petit |
| xl | 1280px | Desktop standard |
| 2xl | 1536px | Grand écran |

---

## Animations globales (Framer Motion)

```ts
fadeInUp: {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
}

fadeInLeft: {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
}

fadeInRight: {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
}

scaleIn: {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.6, ease: "easeOut" },
}

staggerContainer: {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
```

**Déclenchement :** `whileInView` avec `viewport: { once: true, margin: "-80px" }`

> **NOTE**
>
> Toutes les animations sont déclenchées au scroll (intersection observer via Framer Motion `whileInView`). Elles ne se jouent qu'une seule fois (`once: true`). L'easing custom `[0.25, 0.46, 0.45, 0.94]` donne un mouvement naturel, ni trop vif ni trop lent.

---

## Section 1 — Navbar (barre flottante)

> **DÉCISION VALIDÉE** — La navbar est une **barre flottante arrondie**, inspirée de la *forme* de la navbar de developios.com (pas de leurs couleurs).
> Elle **remplace l'ancien comportement « transparent → flouté »** : le fond est désormais toujours visible.

### Barre flottante

```
Desktop (≥ xl / 1280px)
  Position : fixed, z-50, top 24px, centrée horizontalement
  Largeur : calc(100% - 64px), max-width 1280px (32px de retrait de chaque côté)
  Hauteur : 70px · border-radius : 16px
  Fond : --mnh-dark-elevated à 85 % (rgba(20,20,20,0.85))
         + backdrop-filter: blur(16px) saturate(180%)
  Bordure : 1px solid rgba(255,255,255,0.08)
  Ombre : 0 8px 32px rgba(0,0,0,0.25)
  Padding intérieur : 12px à gauche, 8px à droite (le CTA touche presque le bord droit)

État scrollé (après 80px) :
  La barre remonte : top 24px → 12px (translateY(-12px))
  Fond plus opaque : rgba(20,20,20,0.92)
  Transition : 400ms ease — désactivée avec prefers-reduced-motion

Lueur : ligne de 1px en bas de la barre, sur ~60 % de la largeur (centrée),
  dégradé transparent → rgba(103,176,46,0.3) → transparent
```

### Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [LOGO]  Home About Us Services Projects Blog Team Careers Contact Us FAQ  │
│                                         EN ⌄  [🔍 ⌘K]  [Get In Touch ↗]   │
└───────────────────────────────────────────────────────────────────────────┘
  logo à gauche · liens au centre · langue + recherche + CTA à droite
```

- **Logo** : logo officiel (monogramme blanc, `public/brand/mnh-logo-white.png`), 36px de haut, cliquable vers `/`.
- **Nom de la société** (ajout FE-02, décision validée) : « MNH TECHNOLOGIE » en texte à droite de l'icône, dans le **même lien** vers l'accueil, gap 10px. Composant partagé `components/shared/BrandLockup.tsx` (taille `navbar`), aussi utilisé par le footer.
  - Space Grotesk 14px, weight 600, uppercase, tracking 0.06em ; « MNH » en `#F1F5F9`, « TECHNOLOGIE » en `#67B02E` (fond sombre) ; aucun dégradé.
  - Affichage (correction FE-02) : **masqué < 360px** (icône seule) · **visible à partir de 360px, à toutes les largeurs**, en français comme en anglais. Entre 1280 et 1439px, la place est gagnée sur la recherche (loupe ronde) et l'écart des liens (20px) — voir ci-dessous.
  - Jamais de débordement ni de retour à la ligne : le lien peut rétrécir (`min-w-0`) et le nom se tronque (`truncate`) ; la liste des liens garde sa largeur naturelle.
  - Accessibilité : texte visible `aria-hidden`, nom du lien unique « MNH Technologie — Home ».
  - **Mesuré** (Chrome sans interface, polices réelles, FE-02) : nom de 137px jamais tronqué ; marge libre à 1280px : **69px en FR**, 88px en EN ; à 1366–1439px : 133px FR / 152px EN ; ≥ 1440px : 51px FR / 69px EN. Le `truncate` reste la protection si un libellé s'allonge : à remesurer après tout changement des libellés de navigation.
- **Liens** (9) : Home `/` · About Us `/about` · Services `/services` · Projects `/projects` · Blog `/blog` · Team `/team` · Careers `/careers` · Contact Us `/contact` · FAQ `/faq`
  - DM Sans 15px, weight 500, `#94A3B8` → hover `#F1F5F9` (200ms)
  - Lien actif (`usePathname()`) : `#4ADE80` + point rond de 4px en dessous, `aria-current="page"`
  - Gap : **20px entre 1280 et 1439px**, **24px à partir de 1440px** (y compris au-delà de 1536px : l'ancien 32px est abandonné, la barre reste limitée à 1280px).
- **Sélecteur de langue** (FE-02) : « FR » / « EN » + chevron, 40px de haut ; menu déroulant sous la barre, radius 12px, options « Français » / « English » (chaque nom dans sa langue). Chaque option est un **vrai lien** vers la même page dans l'autre langue (via `/language`, qui pose le cookie `mnh_lang`) ; nom accessible « Langue : Français (FR). Changer de langue ».
- **Recherche** : bouton loupe 40px de haut. **Entre 1280 et 1439px : bouton rond (loupe seule, 40px)** comme en mobile, pour laisser la place au nom ; **à partir de 1440px : pilule** (radius 12px) avec badge « ⌘K » / « Ctrl K » — voir *Recherche dans le site* ci-dessous.

### CTA « Get In Touch »

- Hauteur 46px (12px de marge en haut et en bas dans la barre de 70px)
- Padding : 0 18px 0 22px · border-radius 12px
- Fond `#4ADE80`, texte `#0A0A0A`, DM Sans 14px weight 600
- Icône `ArrowUpRight` 16px à droite du texte, gap 8px
- Hover : fond `#67B02E`, flèche `translate(2px, -2px)`, ombre `0 4px 20px rgba(74,222,128,0.3)`, 250ms ease
- Focus visible : outline 2px `#4ADE80`, offset 2px
- Destination : `/contact`

### Mobile et tablette (< 1280px)

- Même barre flottante : **top 12px fixe** (pas de remontée au scroll, seule l'opacité change), 12px des bords, hauteur 60px, radius 14px
- Contenu : logo (28px) à gauche ; loupe + hamburger à droite (boutons ronds de 40px, bordure `#262626`)
- **Panneau latéral** : s'ouvre depuis la droite, à 12px des bords, radius 16px, fond `#141414`, bordure rgba(255,255,255,0.08)
  - Liens empilés (20px, weight 500), langue + CTA pleine largeur (même forme : 46px, radius 12px, flèche ↗) en bas
  - Overlay `rgba(10,10,10,0.5)`, fermeture : croix, overlay, Échap, clic sur un lien
  - Scroll bloqué, focus piégé, focus rendu au hamburger ; animation 300ms ease-out

### Compensation de hauteur

- La barre flotte au-dessus du contenu (24 + 70 = 94px desktop ; 12 + 60 = 72px mobile).
- Variable `--navbar-offset` : **110px** desktop (≥ xl) / **84px** mobile, appliquée en `padding-top` au conteneur de contenu dans `app/[lang]/(public)/layout.tsx`.
- Une section qui gère son propre espace (ex. le Hero, padding-top 160px) peut **passer sous la barre** en ajoutant l'attribut `data-under-navbar`.

### Recherche dans le site (command palette)

- **Déclencheurs** : bouton loupe (`aria-label="Search the site"`), raccourcis globaux **⌘K / Ctrl+K** et **« / »** (ignoré dans un champ de saisie).
- **Fenêtre** : Dialog Base UI, overlay `mnh-black/60` + blur 4px ; panneau max 640px, centré, à 15vh du haut, fond `#141414`, bordure rgba(255,255,255,0.08), radius 16px, ombre `0 24px 80px` (50 % noir). Animation scaleIn 200ms (0.96 → 1). Mobile : à 12px des bords.
- **Contenu** : input (combobox) avec loupe et bouton « Esc » ; résultats groupés (Pages · Services · Projects · Team) ; résultat sélectionné : fond `mnh-accent/8`, bordure gauche 2px `#4ADE80`, titre en `#4ADE80` ; barre d'aide ↑↓ · ↵ · esc.
- **Input vide** : groupe « Suggestions » (pages principales + Get In Touch). **Aucun résultat** : « No results for « … » » + lien « Contact us ».
- **Logique** : insensible à la casse et aux accents ; classement titre → mots-clés → description ; surbrillance de la partie trouvée dans le titre. Mots-clés FR + EN.
- **Données** : `lib/search/` — index statique alimenté par des *providers* (pages, services, projets, équipe), extensible au blog plus tard.

---

## Section 2 — Hero

> **DÉCISION VALIDÉE — Vidéo en arrière-plan.** Le Hero utilise une vidéo de fond (Pexels, réseau « plexus »), ramenée vers le vert MNH, désaturée et assombrie, pour rester une ambiance et non le sujet.
> - Fichiers (`public/videos/`) : `hero-bg.webm` (VP9, 1920px), `hero-bg-opt.mp4` (H.264, 1920px), `hero-bg-mobile.mp4` (720px, < 768px), `hero-poster.webp`. (L'original `hero-bg.mp4`, non servi, a été supprimé.)
> - Boucle de 18s avec fondu enchaîné (pas de saut), sans audio.
> - Poster seul si `prefers-reduced-motion`, mode économie de données ou autoplay refusé ; pause hors écran.
> - Calques par-dessus la vidéo : overlay sombre (le bas se fond dans `#0A0A0A`), vignette, lueur verte, grille en pointillés (ci-dessous).
> - La section porte `data-under-navbar` : elle passe sous la navbar flottante et gère son propre padding-top (160px desktop / 120px mobile).
> - La description passe en `#CBD5E1` (slate-300) pour garder le contraste AA sur la vidéo.

### Fond & ambiance

- Background : `#0A0A0A`
- Hauteur : 100vh minimum (`min-h-screen`), auto si le contenu dépasse
- Padding-top : 160px (espace pour la navbar fixe + respiration)
- Padding-bottom : 120px

**Éléments décoratifs :**

1. Un dégradé radial très subtil centré en haut à droite :
   `radial-gradient(ellipse 60% 50% at 70% 20%, rgba(74, 222, 128, 0.06), transparent)`
2. Un motif de grille en pointillés très discret en arrière-plan :
   `background-image: radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)`
   `background-size: 32px 32px`

### Layout

- Container : `max-w-7xl`, `mx-auto`, `px-6`
- Disposition : centré verticalement (flex, flex-col, items-center, text-center)

```
Desktop :
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   [LABEL "badge"]                        │
│                                                          │
│             Produits digitaux pensés pour                │
│            des résultats business concrets               │
│                                                          │
│             [description en 2 lignes max]                │
│                                                          │
│           [CTA Primary]   [CTA Secondary]                │
│                                                          │
│           ┌──────┐   ┌──────┐   ┌──────┐                 │
│           │ 3 ans│   │  25  │   │ 100  │                 │
│           │ exp. │   │client│   │projet│                 │
│           └──────┘   └──────┘   └──────┘                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Mobile : même structure, tout empilé, CTAs full-width.

### Badge / Label (au-dessus du titre)

- Texte : « Solutions Web, Mobile & IA »
- Conteneur :
  - display: inline-flex, align-items: center, gap: 8px
  - background: rgba(74, 222, 128, 0.08)
  - border: 1px solid rgba(74, 222, 128, 0.2)
  - border-radius: 9999px (pill)
  - padding: 6px 16px
- Texte :
  - Font : DM Sans, 13px, weight 500
  - Couleur : `#4ADE80`
  - text-transform: uppercase
  - letter-spacing: 0.06em
- Icône à gauche : petit cercle vert 6px pulsant (animation CSS infinite)
- Animation entrée : fadeInUp, delay 0s

### Titre H1

- Texte : « Produits digitaux pensés pour des résultats business concrets »
- Font : Space Grotesk, 64px, weight 700
- Couleur : `#F1F5F9`
- Line-height : 1.1
- Letter-spacing : -0.02em
- Max-width : 880px
- Margin-top : 32px
- Le mot « digitaux » a une couleur accent : `#4ADE80`
  - C'est le seul mot coloré du titre.
  - Pas de gradient sur le texte, pas de soulignement. Juste la couleur.
- Animation entrée : chaque ligne se révèle séquentiellement avec un léger décalage.
  - Ligne 1 : fadeInUp, delay 0.15s
  - Ligne 2 : fadeInUp, delay 0.3s
  - Alternativement (plus simple) : le titre entier en fadeInUp, delay 0.15s

### Description

- Texte : « Nous concevons, développons et optimisons des solutions web, mobile et IA pour attirer plus de clients, automatiser les opérations et accélérer la croissance. » (texte réel du site actuel, conservé tel quel)
- Font : DM Sans, 18px, weight 400
- Couleur : `#94A3B8`
- Line-height : 1.7
- Max-width : 640px
- Margin-top : 24px
- Animation : fadeInUp, delay 0.35s

### Double CTA

- Disposition : flex horizontal, gap 16px
- Margin-top : 40px

**CTA Primary : « Découvrir nos services »**
- Background : `#4ADE80`
- Couleur texte : `#0A0A0A`
- Padding : 14px 32px
- Border-radius : 10px
- Font : DM Sans, 15px, weight 600
- Hover :
  - background: `#67B02E`
  - transform: translateY(-2px)
  - box-shadow: 0 8px 32px rgba(74, 222, 128, 0.25)
- Transition : 300ms ease

**CTA Secondary : « Voir nos réalisations »**
- Background : transparent
- Border : 1px solid `#262626`
- Couleur texte : `#F1F5F9`
- Padding : 14px 32px
- Border-radius : 10px
- Font : DM Sans, 15px, weight 500
- Hover :
  - border-color: rgba(74, 222, 128, 0.4)
  - color: `#4ADE80`
  - background: rgba(74, 222, 128, 0.05)
- Transition : 300ms ease

- Animation : fadeInUp, delay 0.45s
- Mobile : flex-col, chaque CTA en full-width

### Compteurs

- Disposition : flex horizontal, gap 48px (desktop), gap 24px (mobile)
- Margin-top : 80px
- Séparés par des lignes verticales : 1px solid `#262626`, height 48px

```
┌──────────┐
│    3+    │  ← Chiffre
│   Ans    │  ← Label
│d'expertise│
└──────────┘
```

- Chiffre :
  - Font : Space Grotesk, 48px, weight 700
  - Couleur : `#F1F5F9`
  - Le « + » après le chiffre en couleur `#4ADE80`
- Animation compteur :
  - De 0 au chiffre final en 2 secondes
  - Easing : easeOut
  - Déclenché au scroll (`whileInView`)
- Label :
  - Font : DM Sans, 14px, weight 400
  - Couleur : `#94A3B8` (`mnh-text-muted-dark` — texte sur fond sombre, contraste AA ; corrigé FE-02)
  - text-transform : uppercase
  - letter-spacing : 0.05em
- Animation globale : fadeInUp, delay 0.55s, stagger 0.1s entre les 3 compteurs
- Mobile : les 3 compteurs en ligne horizontale, réduire gap et taille du chiffre à 36px

---

## Section 3 — Bandeau Clients

### Fond & positionnement

- Background : `#0A0A0A` (continuation du hero, pas de rupture)
- Padding : 60px 0
- Border-top : 1px solid `#1A1A1A` (séparateur très discret)

### Layout

- Pleine largeur (pas de container max-width)
- Titre (optionnel) :
  - Texte : « Ils nous font confiance »
  - Font : DM Sans, 13px, weight 500, uppercase
  - Couleur : `#94A3B8` (`mnh-text-muted-dark` — texte sur fond sombre, contraste AA ; corrigé FE-02)
  - Letter-spacing : 0.1em
  - Text-align : center
  - Margin-bottom : 32px

### Défilement

- Bande horizontale de logos qui défile en continu de droite à gauche
- Vitesse : ~40px/seconde (lente et élégante)
- Aucune interruption — boucle infinie via CSS animation ou duplication du contenu
- Technique : 2 copies côte à côte du même ensemble de logos, `translateX(-50%)` sur la durée totale.
- Effet de masquage : sur les bords gauche et droit, un dégradé linéaire de `#0A0A0A` → transparent (largeur ~120px) pour masquer l'apparition/disparition
  - CSS : `mask-image` ou pseudo-elements avec gradient

### Logos

- Logos des clients : L7rayfi, Loffre.ma, TCFPass, Equipe Afrique, Palmador, SkyHome, Socrat, BenjelSport
- Affichage :
  - Hauteur fixe : 32px (auto × 32px)
  - Filter : grayscale(100%) brightness(0.5) (monochrome très atténué)
  - Opacity : 0.4
- Hover sur un logo :
  - filter: grayscale(0%) brightness(1)
  - opacity: 1
  - Transition : 400ms ease
- Espacement entre logos : 64px (`gap-16`)

> **Note :** les logos réels du site seront utilisés. Pas de faux logos. Si indisponibles, afficher le nom du client en texte stylisé.

---

## Section 4 — Pourquoi MNH

### Fond & ambiance

- Background : `#F9FAFB` (transition vers section claire)
- Padding : 120px 0
- Transition visuelle depuis la section sombre précédente : pas de transition dégradée — coupure nette. Le contraste sombre → clair crée naturellement une "respiration" visuelle.

### Layout

- Container : `max-w-7xl`, `mx-auto`, `px-6`

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [LABEL] POURQUOI NOUS                                   │
│                                                          │
│  Conçu pour des enjeux                                   │
│  business réels                                          │
│                                                          │
│  [Description courte]                                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ ○ Icône      │  │ ○ Icône      │  │ ○ Icône      │    │
│  │              │  │              │  │              │    │
│  │ Titre        │  │ Titre        │  │ Titre        │    │
│  │ Description  │  │ Description  │  │ Description  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Grille : grid, `grid-cols-3` (desktop) / `grid-cols-1` (mobile), `gap-8`

### En-tête de section

**Label :**
- Texte : « POURQUOI NOUS »
- Font : DM Sans, 14px, weight 600, uppercase
- Couleur : `#3F7A1C` (`mnh-brand-text`) sur fond clair · `#67B02E` (`mnh-brand`) sur fond sombre — voir `components/shared/SectionHeader.tsx` (prop `tone`)
- Letter-spacing : 0.08em
- Margin-bottom : 16px
- Décoration : un trait horizontal de 32px × 2px en `#67B02E` à gauche du texte (pseudo-element `::before`) ou en dessous du label — `#67B02E` quel que soit le fond (élément décoratif, non textuel).

**Titre H2 :**
- Texte : « Conçu pour des enjeux business réels »
- Font : Space Grotesk, 48px, weight 700
- Couleur : `#0F172A`
- Le mot « réels » en couleur `#67B02E`
- Max-width : 600px

**Description :**
- Texte réel conservé du site existant
- Font : DM Sans, 17px, weight 400
- Couleur : `#64748B`
- Max-width : 560px
- Margin-top : 16px
- Margin-bottom : 64px

### Cartes (× 3)

Les 3 arguments, texte réel conservé du site :

1. **Produits utiles et orientés résultats** — « Nous développons des fonctionnalités liées à vos objectifs business... »
2. **IA réellement exploitable** — « Nous intégrons l'intelligence artificielle pour un impact mesurable... »
3. **Expérience utilisateur adaptée au marché** — « Des interfaces pensées pour vos utilisateurs... »

**Chaque carte :**
- Background : `#FFFFFF`
- Border : 1px solid `#E2E8F0`
- Border-radius : 16px
- Padding : 36px
- Hover :
  - border-color: rgba(103, 176, 46, 0.3)
  - box-shadow: 0 8px 40px rgba(103, 176, 46, 0.08)
  - transform: translateY(-4px)
- Transition : 350ms ease

**Icône :**
- Conteneur : 56px × 56px, border-radius 12px
- Background : rgba(103, 176, 46, 0.08)
- Icône Lucide : 24px, couleur `#67B02E`
- Icônes recommandées :
  1. `Target` (objectifs) ou `TrendingUp` (résultats)
  2. `Brain` (IA) ou `Sparkles` (intelligence)
  3. `Users` (utilisateurs) ou `Globe` (marché)

**Titre :**
- Font : Space Grotesk, 22px, weight 600
- Couleur : `#0F172A`
- Margin-top : 20px

**Description :**
- Font : DM Sans, 15px, weight 400
- Couleur : `#64748B`
- Line-height : 1.7
- Margin-top : 12px

**Animation :**
- Conteneur parent : staggerContainer
- Chaque carte : fadeInUp avec stagger 0.12s

---

## Section 5 — Services

### Fond

- Background : `#FFFFFF` (continuation de la zone claire)
- Padding : 120px 0

### Layout

- Container : `max-w-7xl`, `mx-auto`, `px-6`
- En-tête : flex horizontal, titre à gauche, bouton « Tous les services » à droite
- Sur mobile : empilé verticalement

```
┌──────────────────────────────────────────────────────────┐
│  NOS SERVICES                            [Voir tout →]   │
│  Produit, croissance et IA réunis                        │
│  pour faire avancer votre business.                      │
│                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │ ○ Code              │  │ ○ Smartphone        │        │
│  │ Développement Web   │  │ Applications        │        │
│  │ description...      │  │ Mobiles             │        │
│  │ [→]                 │  │ description...      │        │
│  └─────────────────────┘  │ [→]                 │        │
│                           └─────────────────────┘        │
│  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │ ○ Brain             │  │ ○ Megaphone         │        │
│  │ Intelligence        │  │ Marketing           │        │
│  │ Artificielle        │  │ Digital             │        │
│  │ description...      │  │ description...      │        │
│  │ [→]                 │  │ [→]                 │        │
│  └─────────────────────┘  └─────────────────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Grille : grid, `grid-cols-2` (desktop) / `grid-cols-1` (mobile), `gap-6`

### En-tête de section

**Label :**
- Texte : « NOS SERVICES »
- Même style que la section précédente (DM Sans, 14px, 600, `#3F7A1C` sur fond clair, uppercase ; trait décoratif en `#67B02E`)

**Titre H2 :**
- Texte conservé : « Produit, croissance et IA réunis pour faire avancer votre business. »
- Font : Space Grotesk, 48px, weight 700
- Couleur : `#0F172A`
- « IA » en couleur `#67B02E`
- Max-width : 650px

**Bouton "Voir tout" (desktop, à droite du titre) :**
- Texte : « Découvrir tous les services »
- Style : ghost button
- Border : 1px solid `#E2E8F0`
- Couleur : `#0F172A`
- Padding : 12px 24px
- Border-radius : 10px
- Hover : border-color `#67B02E`, color `#67B02E`

### Cartes de service (× 4)

Les 4 services (texte réel) :

1. **Développement Web** — icône `Code2` ou `Globe`
2. **Applications Mobiles** — icône `Smartphone`
3. **Intelligence Artificielle** — icône `Brain`
4. **Marketing Digital** — icône `Megaphone` ou `BarChart3`

**Chaque carte :**
- Background : `#F9FAFB`
- Border : 1px solid `#E2E8F0`
- Border-radius : 20px
- Padding : 40px
- Position : relative, overflow: hidden
- Hover :
  - background: `#FFFFFF`
  - border-color: transparent
  - box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06)
  - L'icône grossit légèrement (scale 1.05)
  - Le lien "En savoir plus" se déplace vers la droite de 4px
  - Un trait vertical de 3px en `#67B02E` apparaît sur le bord gauche (pseudo-element `::before`, scaleY 0 → 1, origin top)
- Transition : 350ms ease

**Numéro discret (optionnel) :**
- En haut à droite : « 01 », « 02 », « 03 », « 04 »
- Font : Space Grotesk, 64px, weight 700
- Couleur : rgba(0, 0, 0, 0.03) — quasi invisible, texture graphique
- Position : absolute, top -8px, right 16px

**Icône :**
- Conteneur : 52px × 52px, border-radius 14px
- Background : rgba(103, 176, 46, 0.08)
- Icône Lucide : 24px, stroke-width 1.5, couleur `#67B02E`

**Titre :**
- Font : Space Grotesk, 24px, weight 600
- Couleur : `#0F172A`
- Margin-top : 24px

**Description :**
- Font : DM Sans, 15px, weight 400
- Couleur : `#64748B`
- Line-height : 1.7
- Margin-top : 12px
- Max 3 lignes (~120 caractères)

**Lien "En savoir plus" :**
- Disposition : flex, items-center, gap 8px
- Font : DM Sans, 14px, weight 600
- Couleur : `#67B02E`
- Margin-top : 24px
- Icône : `ArrowRight` (Lucide), 16px
- Hover : gap augmente à 12px (la flèche se déplace)

**Animation :** stagger, fadeInUp, 0.12s entre chaque carte

---

## Section 6 — Portfolio / Réalisations

### Fond & ambiance

- Background : `#0A0A0A` (retour au sombre — rythme dark/light)
- Padding : 120px 0

### Layout

- Container : `max-w-7xl`, `mx-auto`, `px-6`

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  RÉALISATIONS                                            │
│  Des projets concrets, avec des                          │
│  résultats mesurables.                                   │
│                                                          │
│  [Description courte]                    [Voir tout →]   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Place de marché · Matching IA · Opérations       │    │
│  │ Plateforme intelligente interne L7rayfi          │    │
│  │ Description...                              [→]  │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Education · Fonctionnalités IA · Maintenance     │    │
│  │ Plateforme éducative assistée par IA TCFPass     │    │
│  │ Description...                              [→]  │    │
│  └──────────────────────────────────────────────────┘    │
│  ... (4 projets au total)                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Layout : empilé verticalement, `gap-4` entre les cartes

### En-tête

- Label : « RÉALISATIONS » — même style vert brand
- Titre : « Des projets concrets, avec des résultats mesurables. »
  - « mesurables » en couleur `#4ADE80`
  - Font : Space Grotesk, 48px, 700, couleur `#F1F5F9`
- Description (texte réel) : « Découvrez une sélection de projets web, mobile et IA qui illustrent notre approche : simplicité, performance et impact business réel. »
  - Font : DM Sans, 17px, 400, couleur `#94A3B8`

### Cartes de projet (× 4)

Les 4 projets réels : L7rayfi, TCFPass, Loffre.ma, Equipe Afrique

**Chaque carte :**
- Background : `#141414`
- Border : 1px solid `#262626`
- Border-radius : 16px
- Padding : 36px 40px
- Disposition : flex horizontal (desktop)
  - Gauche : contenu textuel (flex-grow)
  - Droite : bouton flèche circulaire
- Sur mobile : contenu empilé, bouton en dessous

**Tags de catégorie :**
- Les tags du site réel (ex : « Place de marché », « Matching IA », « Opérations »)
- Disposition : flex, gap 8px, flex-wrap
- Chaque tag :
  - Font : DM Sans, 12px, weight 500
  - Couleur : `#22D3EE` (cyan — usage parcimonieux ici pour les tags)
  - Background : rgba(34, 211, 238, 0.08)
  - Border : 1px solid rgba(34, 211, 238, 0.15)
  - Padding : 4px 12px
  - Border-radius : 6px

**Titre du projet :**
- Font : Space Grotesk, 24px, weight 600
- Couleur : `#F1F5F9`
- Margin-top : 16px

**Description :**
- Font : DM Sans, 15px, weight 400
- Couleur : `#94A3B8`
- Line-height : 1.7
- Margin-top : 8px

**Bouton flèche :**
- Cercle 48px × 48px
- Border : 1px solid `#262626`
- Background : transparent
- Icône : `ArrowUpRight` (Lucide), 20px, couleur `#94A3B8`
- align-self : center (centré verticalement)
- Hover :
  - background: `#4ADE80`
  - border-color: `#4ADE80`
  - icône couleur : `#0A0A0A`
  - transform: rotate(0deg) — la flèche reste fixe, le fond change
- Transition : 300ms ease

**Hover global de la carte :**
- border-color: `#3A3A3A`
- background: `#181818`
- Le titre passe en couleur `#4ADE80`
- Transition : 350ms ease

**Animation :** fadeInUp avec stagger 0.15s entre les cartes

---

## Section 7 — Équipe

### Fond

- Background : `#F9FAFB` (retour au clair)
- Padding : 120px 0

### Layout

- Container : `max-w-7xl`, `mx-auto`, `px-6`
- Texte centré pour l'en-tête

```
┌──────────────────────────────────────────────────────────┐
│                       NOS MEMBRES                        │
│                   Rencontrez l'équipe                    │
│                                                          │
│   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐      │
│   │ Photo  │   │ Photo  │   │ Photo  │   │ Photo  │      │
│   │        │   │        │   │        │   │        │      │
│   │ Nom    │   │ Nom    │   │ Nom    │   │ Nom    │      │
│   │ Poste  │   │ Poste  │   │ Poste  │   │ Poste  │      │
│   └────────┘   └────────┘   └────────┘   └────────┘      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Grille : grid, `grid-cols-4` (xl) / `grid-cols-2` (md) / `grid-cols-1` (sm), `gap-8`

### En-tête

- Label : « NOS MEMBRES » — vert brand, centré
- Titre : « Rencontrez l'équipe »
  - « l'équipe » en `#67B02E`
  - Font : Space Grotesk, 48px, 700, `#0F172A`, text-align center

### Cartes membres (× 4)

Les 4 membres réels :
- Mohamed Sarghini (PDG)
- Aimane Rhimini (IA & Data)
- Walid Medour (Marketing)
- Nour El Hoda (Responsable)

**Chaque carte :**
- Background : `#FFFFFF`
- Border : 1px solid `#E2E8F0`
- Border-radius : 20px
- Overflow : hidden

**Zone photo :**
- Aspect-ratio : 4/5 (portrait)
- Background : `#E2E8F0` (placeholder si pas de photo)
- Object-fit : cover
- Position : relative

**Overlay social (au hover) :**
- Position : absolute, inset 0
- Background : linear-gradient(to top, rgba(10,10,10,0.85), transparent 60%)
- Opacity : 0 → 1 au hover
- Icônes réseaux en bas :
  - Disposition : flex, gap 12px, position absolute, bottom 16px, left 50%, transform translateX(-50%)
  - Chaque icône :
    - Conteneur : 40px × 40px, border-radius 50%
    - Background : rgba(255,255,255,0.1)
    - Backdrop-filter : blur(4px)
    - Couleur icône : `#F1F5F9`
    - Hover : background `#4ADE80`, couleur `#0A0A0A`
- Transition overlay : 400ms ease

**Zone texte :**
- Padding : 24px
- Text-align : center
- Nom :
  - Font : Space Grotesk, 20px, weight 600
  - Couleur : `#0F172A`
- Poste :
  - Font : DM Sans, 14px, weight 400
  - Couleur : `#64748B`
  - Margin-top : 4px

**Hover global :**
- box-shadow: 0 12px 40px rgba(0,0,0,0.06)
- transform: translateY(-4px)
- Transition : 350ms ease

**Animation :** stagger fadeInUp

---

## Section 8 — Témoignages

### Fond & ambiance

- Background : `#0A0A0A` (sombre)
- Padding : 120px 0

### Layout

- Container : `max-w-7xl`, `mx-auto`, `px-6`
- En-tête centré, carrousel en dessous

```
┌──────────────────────────────────────────────────────────┐
│                       TÉMOIGNAGE                         │
│                    Avis des clients                      │
│                                                          │
│  ◀  ┌──────────────────────────────────────┐  ▶          │
│     │ "Témoignage texte complet..."        │             │
│     │                                      │             │
│     │ ★★★★½                                │             │
│     │ [Logo] Nom du client                 │             │
│     │        Type de plateforme            │             │
│     └──────────────────────────────────────┘             │
│                                                          │
│                         ● ○                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### En-tête

- Label : « TÉMOIGNAGE » — vert brand, centré
- Titre : « Avis des clients »
  - « clients » en `#4ADE80`
  - Font : Space Grotesk, 48px, 700, `#F1F5F9`, text-align center

### Carte de témoignage

Les 2 témoignages réels : L7rayfi et TCFPass (textes conservés tels quels)

**Carte :**
- Max-width : 720px
- Margin : 0 auto
- Background : rgba(255, 255, 255, 0.03)
- Border : 1px solid rgba(255, 255, 255, 0.06)
- Backdrop-filter : blur(12px)
- Border-radius : 24px
- Padding : 48px

**Guillemets décoratifs :**
- En haut à gauche : « " » en icône ou caractère
- Font : Space Grotesk, 72px, weight 700
- Couleur : rgba(74, 222, 128, 0.15)
- Position : absolute, top 24px, left 32px

**Texte du témoignage :**
- Font : DM Sans, 18px, weight 400, italic
- Couleur : `#E2E8F0`
- Line-height : 1.8
- Margin-top : 8px

**Étoiles :**
- 5 étoiles (dont la dernière à moitié — comme sur le site actuel)
- Couleur : `#FBBF24` (jaune doré)
- Taille : 18px
- Gap : 2px
- Margin-top : 24px

**Info client (en bas) :**
- Disposition : flex, items-center, gap 16px
- Margin-top : 24px
- Logo/image :
  - 48px × 48px, border-radius 12px
  - Border : 1px solid `#262626`
  - Object-fit : contain
  - Background : `#141414`
  - Padding : 8px
- Nom :
  - Font : Space Grotesk, 16px, weight 600
  - Couleur : `#F1F5F9`
- Type :
  - Font : DM Sans, 13px, weight 400
  - Couleur : `#94A3B8` (`mnh-text-muted-dark` — texte sur fond sombre, contraste AA ; corrigé FE-02)

### Carrousel

**Navigation par flèches à gauche et à droite :**
- Cercles 44px, border 1px solid `#262626`, fond transparent
- Icône : `ChevronLeft` / `ChevronRight`, 18px, couleur `#94A3B8`
- Hover : border-color `#4ADE80`, couleur `#4ADE80`
- Position : absolute, centrées verticalement

**Indicateurs (dots) :**
- Cercles 8px
- Actif : background `#4ADE80`
- Inactif : background `#3A3A3A`
- Gap : 8px, centrés en dessous, margin-top 32px

- Transition entre slides : 500ms ease, translateX
- Animation entrée : scaleIn

---

## Section 9 — Blog (aperçu)

### Fond

- Background : `#F9FAFB` (clair)
- Padding : 120px 0

### Layout

- Container : `max-w-7xl`, `mx-auto`, `px-6`
- En-tête : flex horizontal, titre à gauche, bouton à droite

```
┌──────────────────────────────────────────────────────────┐
│  BLOG & ACTUALITÉS                     [Voir le blog →]  │
│  Dernières actualités & Blog                             │
│                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐              │
│  │ [image]  │   │ [image]  │   │ [image]  │              │
│  │          │   │          │   │          │              │
│  │ 16 avril │   │ 16 avril │   │ 16 avril │              │
│  │ Titre    │   │ Titre    │   │ Titre    │              │
│  │ article  │   │ article  │   │ article  │              │
│  │ [→]      │   │ [→]      │   │ [→]      │              │
│  └──────────┘   └──────────┘   └──────────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Grille : grid, `grid-cols-3` (lg) / `grid-cols-1` (mobile), `gap-8`

### En-tête

- Label : « BLOG & ACTUALITÉS » — vert brand
- Titre : « Dernières actualités & Blog »
  - « Blog » en `#67B02E`
  - Font : Space Grotesk, 48px, 700, `#0F172A`

### Cartes articles (× 3)

Les 3 articles réels du site.

**Chaque carte :**
- Background : `#FFFFFF`
- Border : 1px solid `#E2E8F0`
- Border-radius : 20px
- Overflow : hidden

**Zone image :**
- Aspect-ratio : 16/10
- Background : `#E2E8F0` (placeholder si image indisponible)
- Object-fit : cover
- Hover : l'image scale à 1.05 (overflow hidden masque le débordement)
- Transition : 500ms ease

**Zone texte :**
- Padding : 28px
- Date :
  - Font : DM Sans, 13px, weight 500
  - Couleur : `#67B02E`
  - Margin-bottom : 12px
- Titre article :
  - Font : Space Grotesk, 20px, weight 600
  - Couleur : `#0F172A`
  - Line-height : 1.35
  - Hover : couleur → `#67B02E`
  - Transition : 200ms
- Lien :
  - Disposition : flex, items-center, gap 8px
  - Font : DM Sans, 14px, weight 600
  - Couleur : `#64748B`
  - Margin-top : 20px
  - Icône : `ArrowRight`, 16px
  - Hover : couleur `#67B02E`, gap → 12px

**Hover global de la carte :**
- box-shadow: 0 16px 48px rgba(0,0,0,0.06)
- transform: translateY(-4px)
- Transition : 350ms ease

**Animation :** stagger fadeInUp

---

## Section 10 — CTA Final

### Fond & ambiance

- Background : `#0A0A0A`
- Padding : 120px 0
- Position : relative, overflow : hidden

**Décoration :**
- Un dégradé radial centré :
  `radial-gradient(ellipse 50% 80% at 50% 50%, rgba(103, 176, 46, 0.08), transparent)`
- Deux lignes horizontales décoratives très discrètes (comme dans le footer actuel) :
  - Hauteur 1px, couleur rgba(103, 176, 46, 0.15)
  - Une au-dessus du texte, une en dessous
  - Largeur : 40% du container, centrées

### Layout

- Container : `max-w-3xl`, `mx-auto`, `px-6`
- Tout centré (text-align center, flex-col, items-center)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                 ─────────────────────────                │
│                                                          │
│               Vous avez un projet en tête ?              │
│                  Travaillons ensemble !                  │
│                                                          │
│                [Parlons de votre projet]                 │
│                                                          │
│                 ─────────────────────────                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Contenu

**Titre (texte réel conservé) :**
- « Vous avez un projet en tête ? Travaillons ensemble ! »
- Font : Space Grotesk, 48px, weight 700
- Couleur : `#F1F5F9`
- « ensemble » en `#4ADE80`
- Line-height : 1.2

**CTA Button :**
- Texte : « Parlons de votre projet »
- Margin-top : 40px
- Style plus grand que les CTAs normaux :
  - Background : `#4ADE80`
  - Couleur texte : `#0A0A0A`
  - Padding : 18px 40px
  - Border-radius : 12px
  - Font : DM Sans, 16px, weight 600
- Hover :
  - background: `#67B02E`
  - transform: translateY(-2px)
  - box-shadow: 0 12px 40px rgba(74, 222, 128, 0.3)
- Transition : 300ms ease

**Animation :** fadeInUp pour le titre + delay 0.2s pour le bouton

---

## Section 11 — Footer (carte flottante + signature « MNH »)

> **DÉCISION VALIDÉE** — Nouveau footer partagé par toutes les pages publiques (`app/[lang]/(public)/layout.tsx`, après le contenu). Il **remplace l'ancien footer** (4 colonnes + signature SVG à dégradés).
> Inspiration *structure et interaction* uniquement : « Chunky Typographic Footer » (bloc de métadonnées en colonnes + signature géante en lettres SVG réactives). Contenu, couleurs et glyphes 100 % MNH.

### Forme : carte flottante (cohérente avec la navbar)

- Posée sur `#0A0A0A`, marge extérieure **12px** mobile / **24px** desktop (côtés et bas)
- Carte : fond `#141414`, bordure 1px rgba(255,255,255,0.08), radius **24px** mobile / **32px** desktop, padding **32px** / **48px**, max-width **1440px**, centrée
- Lueur discrète : radial-gradient en bas au centre, vert brand `#67B02E` à 8 %, derrière la signature
- Langue (FE-02) : interface en français ou en anglais selon la langue de la page ; la devise de marque reste **en français** dans les deux langues (`lang="fr"`)

### Partie haute : 4 colonnes de métadonnées

| Breakpoint | Disposition |
|---|---|
| mobile | 1 colonne, gap 32px |
| md | 2 × 2 |
| lg | `minmax(min-content, 3fr) / 4fr / 3fr / auto`, gap 32px (48px en xl) — la 1ʳᵉ colonne ne descend jamais sous la largeur du logo + nom (≈ 179px, utile vers 1024px) ; la 4ᵉ s'ajuste à l'email pour qu'il tienne sur une ligne |

- Étiquettes : DM Sans 11px, 600, uppercase, tracking 0.12em, `#94A3B8` (`mnh-text-muted-dark`, corrigé FE-02), margin-bottom 12px
- Texte : DM Sans 14px (13px mobile), `#94A3B8`, line-height 1.6, chiffres en tabular-nums

**1. STUDIO** — logo **+ nom « MNH TECHNOLOGIE »** (composant partagé `components/shared/BrandLockup.tsx`, taille `footer` : icône 32px, nom Space Grotesk 14px 600 uppercase tracking 0.06em, « MNH » `#F1F5F9` + « TECHNOLOGIE » `#67B02E`, même rendu que la navbar, toujours visible et jamais tronqué — mesuré de 320 à 1440px, FR et EN), lien vers l'accueil nommé une seule fois (« MNH Technologie — Accueil », nom visuel `aria-hidden`) · « © {année} MNH Technologie » (année via `"use cache"` + `cacheLife("days")`) · **statut en direct** (heure de Casablanca, calculé côté client après le montage) :
- ouvert : point `#4ADE80` pulsant + « Open now: we're building. »
- fermé : point `#64748B` fixe + « Closed: we'll reply next business day. »
- horaires « Mon–Fri · 9:00–18:00 » (fuseau `Africa/Casablanca`, sans pause, jours fériés non gérés)
- adresse dans `<address>` : « Bureau 310, Technopark / Route Nouaceur, 20150 / Casablanca, Maroc » → Google Maps (nouvel onglet)

**2. START A PROJECT** — « Have a project in mind? » (Space Grotesk 22px, 600) · « Tell us where to reach you, and we'll get back to you shortly. »
- Champ email sans cadre, bordure basse rgba(255,255,255,0.2) → `#4ADE80` au focus (200ms), bouton flèche → (glisse de 4px au survol)
- Validation en ligne (« Please enter a valid email. », `aria-live="polite"`), pas de rechargement
- Email valide → `sessionStorage["mnh:prefill-email"]` (jamais dans l'URL) puis `/contact`, qui le lit une fois via `consumePrefillEmail()` (`lib/contact/prefill.ts`). Aucun faux message de succès.

**3. EXPLORE** — deux mini-listes (`<nav>`) côte à côte :
- Pages : `components/layout/navigation.ts` sans Contact (Home, About Us, Services, Projects, Blog, Team, Careers, FAQ), page courante en `#4ADE80`
- Services : `lib/content/services.ts` (mêmes ancres `/services#…` que la recherche)
- Liens : `#94A3B8` → `#F1F5F9` au survol + flèche ↗ qui apparaît (200ms)

**4. SAY HELLO** (alignée à droite en lg) — `contact@mnhtechnologie.com` (mailto, une ligne) · « +212 5 22 52 40 39 » (tel:) · LinkedIn · Instagram (nouvel onglet, `rel="noopener noreferrer"`, aria-label explicite)

### Partie basse : signature géante « MNH »

- Séparateur : ligne 1px en dégradé (transparent → `#67B02E` 30 % → transparent), margin-top 64px, padding-top 32px
- **Glyphes originaux** M, N, H (`lib/brand/glyphs.ts`) : construction anguleuse inspirée du monogramme (fûts de 34 unités, chanfreins à 45°, aucune courbe), viewBox commun `0 0 160 120`
- Rangée flex sans retour à la ligne, chaque lettre `flex: 1 1 0`, gap 2,5 %, max-width 1240px → ~20–21vw de haut, ≤ 300px
- Couleur au repos : `#F1F5F9` à 92 % · `aria-hidden` + `sr-only` « MNH Technologie »
- **Survol** : ressort (scale 1.04, y −8 ; stiffness 450, damping 25, mass 0.8), couleur `#4ADE80` (250ms), lueur `drop-shadow(0 0 24px rgba(74,222,128,0.35))`
- **Clic / tap** : scale 0.96, y +2 (stiffness 600, damping 30) · tactile : pas de survol
- **Entrée au scroll** : y 60 → 0, opacity 0 → 1, stagger 0.1s, une seule fois
- **prefers-reduced-motion** : pas de ressort ni d'entrée animée ; seule la couleur change
- Jamais coupées : overflow visible, padding haut ; aucun scroll horizontal

### Ligne du bas

- Gauche : « L'intelligence dans chaque ligne de code » (12px, uppercase, tracking 0.2em, `#94A3B8` (`mnh-text-muted-dark`, corrigé FE-02))
- Droite : Privacy Policy (`/privacy`) · Terms (`/terms`) · bouton « Back to top » (cercle 40px, bordure `#262626`, survol fond `#4ADE80` + icône `#0A0A0A` ; défilement doux, instantané en reduced-motion)

### Données

Tout le contenu est dans `components/layout/footer/footer-config.ts` (nom légal « MNH TECHNOLOGIE SARLAU » conservé pour un usage futur, non affiché).

---

## Récapitulatif du rythme visuel

| # | Section | Fond | Ambiance |
|---|---|---|---|
| 1 | Navbar | Transparent → `#0A0A0A` blur | Flottante |
| 2 | Hero | `#0A0A0A` + grille pointillée | SOMBRE — Impact |
| 3 | Bandeau Clients | `#0A0A0A` | SOMBRE — Confiance |
| 4 | Pourquoi MNH | `#F9FAFB` | CLAIR — Respiration |
| 5 | Services | `#FFFFFF` | CLAIR — Lisibilité |
| 6 | Portfolio | `#0A0A0A` | SOMBRE — Impact |
| 7 | Équipe | `#F9FAFB` | CLAIR — Humain |
| 8 | Témoignages | `#0A0A0A` | SOMBRE — Émotion |
| 9 | Blog | `#F9FAFB` | CLAIR — Contenu |
| 10 | CTA Final | `#0A0A0A` + lueur verte | SOMBRE — Action |
| 11 | Footer | `#0A0A0A` | SOMBRE — Structure |

> **TIP**
>
> Le rythme SOMBRE → SOMBRE → CLAIR → CLAIR → SOMBRE → CLAIR → SOMBRE → CLAIR → SOMBRE → SOMBRE crée un mouvement de "vagues" visuelles. Chaque transition sombre↔clair agit comme un point de respiration naturel qui guide l'œil de l'utilisateur.

---

## Principes anti-générique

> **CAUTION**
>
> Ce design ne doit PAS ressembler à un template IA. Voici les garde-fous :

- **Pas de dégradés arc-en-ciel** — Seuls les verts MNH et le noir structurent la palette.
- **Pas de blob SVG** — Aucune forme organique aléatoire en arrière-plan.
- **Pas d'illustrations vectorielles génériques** — Pas de personnages flat design.
- **Pas de "Lorem ipsum"** — Tout le texte est réel, issu du site actuel.
- **Pas de faux chiffres** — Les compteurs affichent les valeurs réelles (3, 25, 100).
- **Pas de parallax excessif** — Les animations sont subtiles et fonctionnelles.
- **Pas de preloader** — Le contenu s'affiche immédiatement.
- **Un seul mot coloré par titre** — Jamais de gradient sur le texte, jamais plus d'un accent par H2.
- **Espaces blancs généreux** — Le luxe se mesure en espace libre, pas en densité.
- **Cohérence obsessionnelle** — Mêmes radius, mêmes shadows, mêmes transitions partout.

---

## Questions avant implémentation — Décisions validées

> **IMPORTANT**
>
> Les réponses ci-dessous sont des **décisions validées** par le client. Elles font foi pour l'implémentation.

1. **Le rythme dark/light tel que présenté vous convient-il ?**
   → ✅ **Validé** : Navbar flottante · Hero sombre · Clients sombre · Pourquoi MNH clair · Services clair · Portfolio sombre · Équipe clair · Témoignages sombre · Blog clair · CTA final sombre · Footer sombre.

2. **Les interactions hover décrites sont-elles au bon niveau de subtilité ?**
   → ✅ **Validé.** Garder des hover subtils (200–400ms, déplacements de 1 à 4px max). Respecter `prefers-reduced-motion`.

3. **La typographie Space Grotesk + DM Sans correspond-elle à l'image voulue ?**
   → ✅ **Validé.** Charger les deux polices via `next/font/google` (pas de `<link>` Google Fonts), exposées comme variables CSS et branchées dans le `@theme` Tailwind v4.

4. **Les animations Framer Motion sont-elles suffisamment riches sans être excessives ?**
   → ✅ **Validé.** Créer un fichier partagé de variants (`fadeInUp`, `fadeInLeft`, `fadeInRight`, `scaleIn`, `staggerContainer`) avec l'easing `[0.25, 0.46, 0.45, 0.94]`, `whileInView`, `viewport: { once: true, margin: "-80px" }`, pour que toutes les sections les réutilisent.

5. **Mode sombre/clair commutable (toggle) ou design hybride fixe ?**
   → ✅ **Design hybride fixe.** Pas de toggle de thème.

**Décision supplémentaire :** le Hero aura une **vidéo en arrière-plan** (tâche séparée, après la Navbar).
