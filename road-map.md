# Plan d'attaque – CoWork'Space

**Contexte :** 2 devs, 4 jours, monorepo (frontend + backend).  
**Objectif :** livrer le MVP en découpant le travail par **logique métier**, avec des **features autonomes** et des **merges quotidiens** sur `main`.

---

## 1. Principes

| Principe             | Règle                                                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Autonomie**        | Une feature doit pouvoir être développée, testée et mergée sans attendre qu’une autre soit terminée. Si elle dépend d’une autre, la dépendance doit être une **slice minimale** (ex. auth = login + “moi” uniquement au début). |
| **Découpage métier** | Chaque branche = un domaine métier (auth, espaces, réservations, admin), pas “tout le backend” ou “tout le frontend”.                                                                                                           |
| **Merge quotidien**  | En fin de journée : merge des branches terminées sur `main`. Chaque matin : repartir de `main` (pull/rebase) pour les nouvelles branches.                                                                                       |
| **Branches courtes** | Une branche = une feature livrable (ex. `auth/session`, `espaces/lecture`), pas une branche fourre-tout.                                                                                                                        |

---

## 2. Dépendances entre features (ordre de livraison)

```
                    ┌─────────────────┐
                    │  auth/session   │  ← À livrer en premier (login + JWT + "moi")
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ espaces/lecture  │ │ auth/inscription│ │  auth/profil    │
│ (plan, filtres)  │ │ (register,      │ │ (profil, reset  │
│ 0 dépendance     │ │  validation)    │ │  MDP)           │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
         │  auth/session + espaces/lecture = contrat minimal pour résas
         ▼
┌─────────────────┐
│ reservations/*  │  calendrier → créer → modifier/annuler → récurrence → historique/PDF
└────────┬────────┘
         │
         ▼
┌─────────────────┐  ┌─────────────────┐
│ admin/membres    │  │ admin/espaces   │  │ admin/dashboard │
│ admin/dashboard │  │ (CRUD espaces,   │  │ (stats jour,    │
│ (valider, liste) │  │  équipements)   │  │  occupation)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐
│ notifications/* │  Branches dédiées ou intégrées dans auth + résas selon choix.
└─────────────────┘
```

**Règle :** tout ce qui est en amont doit être sur `main` avant de démarrer une feature en aval. Les deux seules “bases” obligatoires pour le cœur métier sont **auth/session** et **espaces/lecture**.

---

## 3. Inventaire des features (slices autonomes)

### 3.1 Fondations (jour 1 prioritaire)

| Feature             | Branche           | Dépend de | Backend                                                           | Frontend                                                                                                       | User stories           |
| ------------------- | ----------------- | --------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Session (login)** | `auth/session`    | —         | Login (email+MDP → JWT), GET /me, guard JWT, rôles de base        | Page login, stockage token, redirection selon rôle, déconnexion                                                | US-AUTH-03, US-AUTH-04 |
| **Lecture espaces** | `espaces/lecture` | —         | GET espaces (liste, détail, avec équipements), pas d’auth requise | Plan/liste espaces, statut (dispo/réservé/occupé), capacité, équipements, filtres (type, équipement, capacité) | US-VIS-01 à 04         |

### 3.2 Auth étendu (après auth/session)

| Feature          | Branche            | Dépend de                           | Backend                                                       | Frontend                                      | User stories           |
| ---------------- | ------------------ | ----------------------------------- | ------------------------------------------------------------- | --------------------------------------------- | ---------------------- |
| **Inscription**  | `auth/inscription` | auth/session (optionnel pour “moi”) | Register, validation email (token), endpoint validation admin | Formulaire inscription, page “lien cliqué”    | US-AUTH-01, US-AUTH-02 |
| **Profil & MDP** | `auth/profil`      | auth/session                        | PATCH /me, reset MDP (token + email)                          | Formulaire profil, page “mot de passe oublié” | US-AUTH-05, US-AUTH-06 |

### 3.3 Réservations (après auth/session + espaces/lecture)

| Feature                  | Branche                          | Dépend de                     | Backend                                                   | Frontend                                                       | User stories                 |
| ------------------------ | -------------------------------- | ----------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------- |
| **Calendrier (lecture)** | `reservations/calendrier`        | auth/session, espaces/lecture | GET résas par espace et/ou par période (créneaux occupés) | Vue calendrier hebdo, créneaux non sélectionnables si réservés | US-RES-01                    |
| **Créer réservation**    | `reservations/creer`             | idem                          | POST résa (vérif conflits), option privé                  | Formulaire créneau + espace, confirmation                      | US-RES-02, US-RES-07 (privé) |
| **Modifier / Annuler**   | `reservations/modifier-annuler`  | idem                          | PATCH, DELETE résa, pas de conflit                        | Modifier horaire/espace, annuler avec confirmation             | US-RES-04, US-RES-05         |
| **Récurrence**           | `reservations/recurrence`        | idem                          | Règle RRULE, création des occurrences                     | UI récurrence (jour, fréquence)                                | US-RES-03                    |
| **Historique & PDF**     | `reservations/historique-export` | idem                          | GET mes résas (passées), option export                    | Liste résas passées, bouton export PDF                         | US-RES-06, US-RES-08         |

### 3.4 Administration (après auth + selon besoin)

| Feature             | Branche           | Dépend de                                         | Backend                                                   | Frontend                                                                      | User stories         |
| ------------------- | ----------------- | ------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------- |
| **Admin membres**   | `admin/membres`   | auth/session (rôle admin), auth/inscription utile | Liste users, valider/refuser inscription, actif/inactif   | Liste inscriptions en attente, liste membres, boutons valider/refuser, statut | US-ADM-01, US-ADM-04 |
| **Admin espaces**   | `admin/espaces`   | auth/session (admin), espaces/lecture             | CRUD espaces, CRUD équipements, liaison espace–équipement | CRUD espaces et équipements (formulaires)                                     | US-ADM-02, US-ADM-03 |
| **Admin dashboard** | `admin/dashboard` | auth/session (admin), résas en lecture            | Agrégations : résas du jour, taux occupation hebdo        | Tableau de bord (chiffres, graphiques)                                        | US-ADM-05            |

### 3.5 Transverse & Notifications

| Feature               | Branche                            | Dépend de               | Backend                                                       | Frontend                   | User stories   |
| --------------------- | ---------------------------------- | ----------------------- | ------------------------------------------------------------- | -------------------------- | -------------- |
| **Recherche globale** | `transverse/recherche`             | espaces + résas exposés | Recherche espaces + résas (texte)                             | Champ recherche, résultats | US-TRA-01      |
| **Notifications**     | `notifications/emails` ou par type | auth + résas            | Envoi email (inscription, résa, rappel 24h, annulation/modif) | —                          | US-NOT-01 à 04 |

---

## 4. Répartition 2 devs (suggestion)

**Dev 1 – Identité & admin personnes**

- Jour 1 : `auth/session` (priorité absolue).
- Jour 2 : `auth/inscription` puis `admin/membres`.
- Jour 3 : `auth/profil`, `admin/dashboard`.
- Jour 4 : `notifications/emails` (partie inscription + résa si temps), correctifs, polish.

**Dev 2 – Espaces & réservations**

- Jour 1 : `espaces/lecture` (plan, filtres, statuts).
- Jour 2 : `reservations/calendrier` + `reservations/creer`.
- Jour 3 : `reservations/modifier-annuler`, `reservations/recurrence`, `admin/espaces`.
- Jour 4 : `reservations/historique-export`, `transverse/recherche`, correctifs, polish.

**Point de synchro :** à la fin du jour 1, `auth/session` et `espaces/lecture` doivent être sur `main` pour que Dev 2 enchaîne sereinement sur les résas.

---

## 5. Plan jour par jour (détail)

### Jour 1 – Fondations

| Qui       | Matin                                                     | Après-midi                                                               | Merge en fin de journée    |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------- |
| **Dev 1** | Backend : login, JWT, GET /me, Role (admin/member), guard | Frontend : page login, déconnexion, redirection selon rôle               | `auth/session` → `main`    |
| **Dev 2** | Backend : GET espaces (liste, détail, équipements)        | Frontend : plan ou liste espaces, statut, capacité, équipements, filtres | `espaces/lecture` → `main` |

**Checklist jour 1**

- [ ] Un utilisateur peut se connecter et recevoir un JWT.
- [ ] GET /me renvoie l’utilisateur courant (id, email, rôle).
- [ ] Les espaces sont listables avec type, statut, capacité, équipements.
- [ ] Les filtres (type, équipement, capacité) fonctionnent.
- [ ] Chacun a fait un pull/rebase de `main` avant de merger sa branche.

---

### Jour 2 – Résas cœur + auth étendu

| Qui       | Matin                                                            | Après-midi                                                                                         | Merge en fin de journée             |
| --------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Dev 1** | Backend : register, validation email (token), liste “en attente” | Frontend : formulaire inscription, (optionnel) lien validation                                     | `auth/inscription` → `main`         |
| **Dev 1** | —                                                                | Backend : endpoints admin membres (liste, valider, actif/inactif). Frontend : écrans admin membres | `admin/membres` → `main` (si temps) |
| **Dev 2** | Backend : GET résas par espace/période (créneaux occupés)        | Frontend : calendrier hebdo (FullCalendar ou équivalent), créneaux réservés grisés                 | `reservations/calendrier` → `main`  |
| **Dev 2** | —                                                                | Backend : POST résa (conflits, option privé). Frontend : formulaire résa, confirmation             | `reservations/creer` → `main`       |

**Checklist jour 2**

- [ ] Inscription possible, email de confirmation (ou stub).
- [ ] Calendrier affiche les créneaux occupés par espace.
- [ ] Création d’une réservation (espace + créneau) avec vérification des conflits.
- [ ] Admin peut lister et valider les inscriptions (si `admin/membres` mergé).

---

### Jour 3 – Résas avancées + dashboard

| Qui       | Matin                                              | Après-midi                                                                    | Merge en fin de journée                  |
| --------- | -------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| **Dev 1** | Backend : PATCH /me, reset MDP (lien email)        | Frontend : formulaire profil, page “mot de passe oublié”                      | `auth/profil` → `main`                   |
| **Dev 1** | —                                                  | Backend : stats (résas du jour, occupation hebdo). Frontend : dashboard admin | `admin/dashboard` → `main`               |
| **Dev 2** | Backend : PATCH/DELETE résa, règles conflits       | Frontend : modifier résa, annuler avec confirmation                           | `reservations/modifier-annuler` → `main` |
| **Dev 2** | Backend : récurrence (RRULE), création occurrences | Frontend : option récurrence dans le formulaire                               | `reservations/recurrence` → `main`       |
| **Dev 2** | —                                                  | Backend : CRUD espaces + équipements. Frontend : admin espaces/équipements    | `admin/espaces` → `main`                 |

**Checklist jour 3**

- [ ] Profil modifiable, reset MDP opérationnel.
- [ ] Modification et annulation de résa avec contrôle des conflits.
- [ ] Réservation récurrente (au moins cas simple).
- [ ] Admin : dashboard avec indicateurs ; gestion espaces et équipements.

---

### Jour 4 – Finalisation

| Qui       | Tâches                                                                                                         | Merge                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Dev 1** | Notifications emails (inscription, résa, annulation/modif, rappel 24h si cron possible), correctifs auth/admin | `notifications/emails` + correctifs → `main`                      |
| **Dev 2** | Historique “mes résas” passées, export PDF, recherche globale (espaces + résas), correctifs résas/plan         | `reservations/historique-export`, `transverse/recherche` → `main` |
| **Tous**  | Tests manuels, responsive, polish UI, fix des bugs restants                                                    | Branches de fix → `main`                                          |

**Checklist jour 4**

- [ ] Historique des réservations passées consultable.
- [ ] Export PDF des résas (période choisie).
- [ ] Recherche globale espaces / réservations.
- [ ] Emails envoyés sur inscription, résa, modification, annulation (et rappel si prévu).
- [ ] Application utilisable de bout en bout (parcours membre + admin).

---

## 6. Règles Git

| Règle                | Détail                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nom des branches** | `auth/session`, `espaces/lecture`, `reservations/creer`, `admin/membres`, etc. (une branche = une feature full-stack).                                                   |
| **Création**         | Toujours partir de `main` à jour                                                                                                                                         |
| **Merge**            | En fin de journée (ou quand la feature est prête) : merge vers `main`, résoudre les conflits tout de suite.                                                              |
| **Rebase**           | Au moins une fois par jour merge main dans ta branche                                                                                                                    |
| **Pas de merge**     | Ne pas merger une branche qui dépend d’une autre non encore mergée (ex. ne pas merger `reservations/creer` si `auth/session` ou `espaces/lecture` n’est pas sur `main`). |

---

## 7. Checklist globale MVP (avant livraison)

- [ ] **Auth** : inscription, validation email, connexion, déconnexion, reset MDP, profil (US-AUTH-01 à 06).
- [ ] **Visualisation** : plan/liste espaces, statut, équipements, capacité, filtres (US-VIS-01 à 04).
- [ ] **Réservation** : calendrier, créer, modifier, annuler, récurrence, historique, privé, export PDF (US-RES-01 à 08).
- [ ] **Admin** : valider inscriptions, gérer espaces et équipements, gérer membres, dashboard (US-ADM-01 à 05).
- [ ] **Transverse** : recherche globale (US-TRA-01).
- [ ] **Notifications** : emails inscription, résa, rappel, annulation/modif (US-NOT-01 à 04).
- [ ] **Contraintes** : responsive, réservation en ≤ 3 actions principales, sécurité (mots de passe hashés, accès admin restreint).

---

## 8. Références

- User stories : `docs/02-user-stories.md`
- Schéma données : `backend/prisma/schema.prisma`
- Charte graphique / stack front : `docs/04-charte-graphique.md`
- Cas d’utilisation : `docs/01-diagramme-cas-utilisation.puml`
