# User Stories – CoWork'Space

Document de conception – aligné au cahier des charges et au diagramme de cas d’utilisation.

---

## 1. Module Authentification

| ID         | En tant que    | Je veux                                              | Afin de                                | Critères d'acceptation                                                                    |
| ---------- | -------------- | ---------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| US-AUTH-01 | Visiteur       | m’inscrire avec email, mot de passe et infos de base | devenir membre et réserver des espaces | Formulaire inscription ; validation email envoyée ; compte en attente de validation admin |
| US-AUTH-02 | Membre         | valider mon email en cliquant le lien reçu           | activer mon compte et me connecter     | Lien dans l’email ; clic valide l’email ; redirection vers connexion                      |
| US-AUTH-03 | Membre / Admin | me connecter avec email et mot de passe              | accéder à mon espace                   | Connexion sécurisée ; redirection selon rôle (membre / admin)                             |
| US-AUTH-04 | Membre / Admin | me déconnecter                                       | sécuriser ma session                   | Un clic ; session fermée ; redirection accueil ou login                                   |
| US-AUTH-05 | Membre         | réinitialiser mon mot de passe par email             | retrouver l’accès si je l’oublie       | Lien « mot de passe oublié » ; email avec lien ; nouveau mot de passe sécurisé            |
| US-AUTH-06 | Membre         | modifier mon profil (nom, prénom, téléphone, photo)  | garder mes informations à jour         | Formulaire pré-rempli ; sauvegarde ; feedback succès                                      |

---

## 2. Module Visualisation

| ID        | En tant que | Je veux                                                    | Afin de                             | Critères d'acceptation                                                          |
| --------- | ----------- | ---------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| US-VIS-01 | Membre      | visualiser les espaces (openspace + salles) en plan        | voir la disposition et les zones    | Plan simplifié ; 50 postes + 4 salles identifiables                             |
| US-VIS-02 | Membre      | voir le statut des espaces (disponible / réservé / occupé) | choisir un espace libre             | Code couleur ou indicateur par espace                                           |
| US-VIS-03 | Membre      | voir les équipements et la capacité de chaque espace       | filtrer selon mes besoins           | Affichage équipements (vidéoprojecteur, écran, whiteboard…) et nombre de places |
| US-VIS-04 | Membre      | filtrer les espaces (type, équipement, capacité)           | trouver rapidement un espace adapté | Filtres appliqués ; liste/plan mis à jour                                       |

---

## 3. Module Réservation

| ID        | En tant que | Je veux                                                      | Afin de                                      | Critères d'acceptation                                                  |
| --------- | ----------- | ------------------------------------------------------------ | -------------------------------------------- | ----------------------------------------------------------------------- |
| US-RES-01 | Membre      | consulter le calendrier hebdomadaire des disponibilités      | voir les créneaux libres                     | Vue semaine ; créneaux réservés non sélectionnables                     |
| US-RES-02 | Membre      | réserver un espace sur un créneau                            | garantir mon poste ou ma salle               | Sélection espace + date + heure ; confirmation ; email envoyé           |
| US-RES-03 | Membre      | créer une réservation récurrente (ex. tous les mardis matin) | éviter de réserver à chaque fois             | Choix récurrence (jour, fréquence) ; créneaux créés ; confirmation      |
| US-RES-04 | Membre      | modifier une réservation existante                           | ajuster horaire ou espace                    | Modification date/heure/espace ; pas de conflit ; email de notification |
| US-RES-05 | Membre      | annuler une réservation                                      | libérer le créneau                           | Confirmation avant annulation ; email d’annulation                      |
| US-RES-06 | Membre      | consulter l’historique de mes réservations passées           | suivre mon usage                             | Liste des réservations passées ; filtres possibles                      |
| US-RES-07 | Membre      | marquer une réservation comme privée ou non                  | protéger la confidentialité de mon événement | Option privé/non privé ; si privé : affichage « occupé » sans détail    |
| US-RES-08 | Membre      | exporter mes réservations en PDF                             | avoir un récapitulatif imprimable            | Bouton export PDF ; document avec mes réservations (période choisie)    |

---

## 4. Fonctionnalités transverses

| ID        | En tant que | Je veux                                             | Afin de                     | Critères d'acceptation                                                |
| --------- | ----------- | --------------------------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| US-TRA-01 | Membre      | faire une recherche globale (espaces, réservations) | trouver une info rapidement | Champ recherche ; résultats espaces et/ou réservations selon contexte |

---

## 5. Module Administration

| ID        | En tant que    | Je veux                                                                      | Afin de                         | Critères d'acceptation                                                  |
| --------- | -------------- | ---------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| US-ADM-01 | Administrateur | valider manuellement les inscriptions                                        | contrôler qui devient membre    | Liste inscriptions en attente ; bouton valider/refuser ; membre notifié |
| US-ADM-02 | Administrateur | gérer les espaces (CRUD postes et salles)                                    | adapter l’offre aux besoins     | Création, modification, suppression ; type, capacité, nom               |
| US-ADM-03 | Administrateur | gérer les équipements des espaces                                            | refléter les moyens disponibles | Associer équipements aux espaces (vidéoprojecteur, écran, whiteboard…)  |
| US-ADM-04 | Administrateur | consulter et gérer la liste des membres (statut actif/inactif)               | suivre les membres              | Liste membres ; statut actif/inactif ; mise à jour du statut            |
| US-ADM-05 | Administrateur | consulter le tableau de bord (réservations du jour, taux d’occupation hebdo) | avoir une vision synthétique    | Nombre de réservations du jour ; taux d’occupation de la semaine        |

---

## 6. Module Notifications (système)

Les notifications sont déclenchées par les cas d’usage ; pas d’action utilisateur directe.

| ID        | Description                                | Déclencheur                                              |
| --------- | ------------------------------------------ | -------------------------------------------------------- |
| US-NOT-01 | Email de confirmation d’inscription        | Après « S’inscrire »                                     |
| US-NOT-02 | Email de confirmation de réservation       | Après « Réserver espace » (et récurrente)                |
| US-NOT-03 | Email de rappel 24 h avant la réservation  | Tâche planifiée (cron)                                   |
| US-NOT-04 | Email lors d’annulation ou de modification | Après « Annuler réservation » / « Modifier réservation » |

---

## 7. Contraintes transverses (à respecter dans tous les écrans)

- **Responsive** : interface utilisable sur desktop, tablette et mobile.
- **Réservation** : réalisable en moins de 3 actions principales (accès calendrier → choix créneau → confirmation).
- **Sécurité** : mots de passe hashés ; protection injection SQL ; accès admin restreint.

---

## Légende

- **En tant que** : rôle (Visiteur, Membre, Administrateur).
- **Je veux** : objectif utilisateur.
- **Afin de** : bénéfice / raison.
- **Critères d’acceptation** : conditions pour considérer la story livrée.

Ce document peut être exporté ou copié depuis votre fichier CoWorkSpace-UserStory.numbers pour garder une seule source de vérité ; cette version Markdown sert de base versionnable et alignée au dossier de conception.
