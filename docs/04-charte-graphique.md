# Charte graphique – CoWork'Space

Document de conception – Définition de la charte graphique et des tokens de design pour l’application CoWork'Space.

---

## 1. Principes et ton

- **Ton** : professionnel, sobre, rassurant (gestion d’espace et de réservations).
- **Cible** : membres et administrateurs ; usage bureau et **mobile** (responsive).
- **Accessibilité** : contraste WCAG 2.1 AA, focus visible (ring), touch targets ≥ 44px sur mobile.

---

## 2. Palette de couleurs

### 2.1 Couleurs principales (shadcn)

Les variables suivantes sont définies dans `src/index.css` et utilisées par les composants shadcn :

- **background / foreground** : fond de page et texte principal.
- **primary / primary-foreground** : actions principales et identité (boutons, liens).
- **secondary / muted / accent** : fonds secondaires, texte atténué, surbrillance.
- **destructive** : annulation, suppression, erreur.
- **border / input / ring** : bordures, champs, focus.

### 2.2 Couleurs sémantiques

- **Succès** : confirmation, réservation validée (vert).
- **Alerte / attente** : réservation à venir, rappel (ambre / orange).
- **Erreur / destructif** : annulation, conflit, erreur (rouge).
- **Info** : messages informatifs (bleu).

### 2.3 Statuts des espaces (plan + calendrier + listes)

À réutiliser partout (plan architecte, vue calendrier, listes) :

| Statut        | Usage                    | Variable CSS (exemple)   |
|---------------|--------------------------|--------------------------|
| **Disponible**| Créneau libre            | `--status-available`    |
| **Réservé**   | Créneau réservé          | `--status-reserved`      |
| **Occupé**    | En cours d’utilisation  | `--status-occupied`      |
| **Indisponible** | Maintenance, fermé   | `--status-unavailable`  |

Couleurs recommandées : vert clair (disponible), ambre (réservé), gris ou rouge léger (occupé), gris neutre (indisponible).

---

## 3. Typographie

- **Titres** : police distinctive et lisible (ex. Plus Jakarta Sans, DM Sans – Google Fonts).
- **Corps** : police très lisible (ex. Inter, Source Sans 3).
- **Échelle** : hiérarchie claire (h1 → h4, body, small, caption) ; échelle type 1.25 (major third).
- **Poids** : regular (400), medium (500), semibold (600), bold (700).

La police par défaut du projet (Geist Variable) est définie via shadcn ; elle peut être complétée ou remplacée selon la charte ci‑dessus.

---

## 4. Espacements, rayons, ombres

- **Espacements** : grille cohérente (échelle Tailwind : 2, 4, 6, 8…).
- **Rayons** : variable `--radius` (ex. 0.625rem) pour shadcn ; rayons dérivés (`--radius-sm`, `--radius-lg`, etc.).
- **Ombres** : 2–3 niveaux (subtle, medium, strong) pour cartes, dropdowns et modales.

---

## 5. Composants et patterns

- **Navigation** : sidebar (admin), header avec menu ; lien actif visuellement distinct.
- **Formulaires** : champs avec label, message d’erreur, bouton principal/secondaire (composants shadcn Input, Label, Button).
- **Feedback** : toasts (sonner) pour succès/erreur ; modales (Dialog) pour confirmation.
- **Données** : tableaux (Table) pour listes admin ; badges pour statuts (actif/inactif, statut réservation).
- **Plan des espaces** : couleurs de statut (disponible, réservé, occupé) ; légende visible ; zones cliquables avec hover/focus.

---

## 6. Responsive et breakpoints

- **Breakpoints** : ceux de Tailwind (sm, md, lg, xl) ; mobile first.
- **Touch** : boutons et zones cliquables ≥ 44px en hauteur sur mobile.

---

## 7. Mode sombre (optionnel)

- Variables du thème définies dans `.dark` (déjà présentes dans `index.css`).
- Toggle dans le header ou préférence système selon choix du projet.

---

## 8. Animations (anime.js)

Les animations sont réalisées avec **anime.js** (v4). Ton : sobre et rapide, pour renforcer le feedback sans distraire.

### 8.1 Règles générales

- **Durées** : 200–300 ms pour les micro-interactions, 300–400 ms pour les apparitions, 400–500 ms pour les transitions de vue.
- **Easing** : privilégier `easeOutQuad` ou `easeOutCubic` pour les entrées, `easeInOutQuad` pour les transitions bidirectionnelles.
- **Réduction du mouvement** : respecter `prefers-reduced-motion: reduce` (pas d’animation ou version très courte/opacité seule).

### 8.2 Par type d’action

| Action / Contexte | Type d’animation | Paramètres indicatifs (anime.js) |
|-------------------|------------------|-----------------------------------|
| **Entrée de section ou de bloc** (ex. carte, liste) | Apparition en fondu + léger décalage vertical | `opacity: [0, 1]`, `y: [12, 0]`, `duration: 320`, `ease: 'easeOutCubic'` |
| **Entrée d’une liste (stagger)** | Même effet, décalé par élément | `stagger(50, { from: 'first' })` sur `delay` |
| **Ouverture de modale / Dialog** | Fondu + légère mise à l’échelle du contenu | `opacity: [0, 1]`, `scale: [0.98, 1]`, `duration: 250`, `ease: 'easeOutCubic'` |
| **Fermeture de modale** | Inverse court | `opacity: [1, 0]`, `duration: 200` avant unmount |
| **Apparition d’un toast** | Slide court + fondu | `opacity: [0, 1]`, `x: [16, 0]` ou `y: [-8, 0]`, `duration: 280` |
| **Clic sur bouton (feedback visuel)** | Léger scale down puis retour | `scale: [1, 0.97]` puis `scale: [0.97, 1]`, `duration: 120` |
| **Changement d’onglet (Tabs)** | Translation du indicateur + fondu léger du contenu | Indicateur : `translateX` + `duration: 220` ; contenu : `opacity: [0.6, 1]`, `duration: 200` |
| **Sélection / survol d’un créneau (calendrier ou plan)** | Légère surbrillance ou scale | `opacity` ou `scale: [1, 1.02]`, `duration: 180` |
| **Succès après soumission (ex. réservation)** | Confirmation courte sur le bloc concerné | `opacity: [1, 0.7, 1]` ou léger `scale` pulse, `duration: 400` |
| **Erreur de formulaire** | Secousse horizontale légère (shake) | `translateX: [0, -6, 6, -4, 4, 0]`, `duration: 400` |

### 8.3 Où appliquer

- **Composants** : utiliser le hook `useAnimeRef` (voir `src/hooks/useAnimeRef.ts`) ou appeler `animate()` dans un `useEffect` avec une ref.
- **Modales / Toasts** : animer le contenu au mount ; à la fermeture, lancer l’animation inverse puis unmount après la fin (callback `complete` ou `then`).
- **Listes** : utiliser `stagger()` d’anime.js sur le `delay` pour les entrées d’éléments (cartes, lignes).

---

## 9. Stack technique (rappel)

- **React 19** + **Tailwind v4** + **shadcn/ui** pour l’interface.
- **FullCalendar** (vue calendrier hebdomadaire des disponibilités).
- **React Konva** (optionnel) pour le plan architecte des espaces.
- **anime.js** (v4) pour les animations (voir section 8). Utilisation via `useEffect` + ref ou via le hook `useAnimeRef` (voir `src/hooks/useAnimeRef.ts`).

Les couleurs et variables de la charte sont centralisées dans `frontend/src/index.css` et exposées à Tailwind via `@theme inline`.
