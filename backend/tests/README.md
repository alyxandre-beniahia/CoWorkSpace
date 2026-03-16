# Plan de tests backend

## Cahier des recettes

| Fonctionnalité | Description | Résultats attendus |
| --- | --- | --- |
| Création d’une réservation | L’utilisateur authentifié peut créer une réservation pour un espace donné, sur un créneau horaire libre. | La réservation est créée en base, visible dans le calendrier et dans l’historique de l’utilisateur, sans chevauchement avec d’autres réservations. |
| Modification d’une réservation | L’utilisateur (ou l’admin) peut modifier une réservation existante (horaire, titre, récurrence, poste, etc.). | Les règles métier sont respectées (pas de conflits, droits de modification corrects), les changements sont immédiatement visibles dans le calendrier. |
| Annulation d’une réservation | L’utilisateur peut annuler sa réservation, l’admin peut annuler toute réservation (ponctuelle ou récurrente). | Le statut est mis à jour, les créneaux libérés, les notifications éventuelles sont envoyées. |
| Gestion des espaces | L’admin peut créer, mettre à jour, désactiver des espaces (capacité, type, équipements, statut). | Les espaces sont correctement exposés dans l’API et sur le frontend, les filtres et le plan sont à jour. |
| Authentification & rôles | Gestion des comptes, connexion, rôles (admin / membre) et droits associés. | Accès aux routes protégées sécurisé, actions restreintes selon le rôle, tokens JWT valides et expirations gérées. |

## Stratégie de test

| Type de test | Cible du test | Description | Outil utilisé |
| --- | --- | --- | --- |
| Tests unitaires | Use cases, services de domaine, helpers | Vérifier la logique métier isolée (règles de réservation, conflits, droits, transformations de données). | Jest (suite de tests NestJS) |
| Tests d’intégration | Contrôleurs HTTP, repository Prisma, configuration de la BDD | Vérifier l’intégration entre l’API NestJS, Prisma et la base de données (requêtes, transactions, erreurs). | Jest (configs `jest-integration.config.js`) + base Postgres de test |
| Tests fonctionnels (end-to-end API) | Flux métier complets (création, modification, annulation de réservation, gestion des espaces) | Vérifier qu’un scénario complet fonctionne de bout en bout via l’API HTTP (statuts, payloads, enchaînement). | Jest fonctionnel / supertest (configs `jest-functional.config.js`) |
| Tests end-to-end UI | Parcours utilisateur (réservation via l’interface, tableau de bord admin) | Vérifier l’expérience utilisateur globale via le navigateur (navigation, formulaires, messages d’erreur). | Cypress (frontend React) |
| Tests de performance | Endpoints critiques (création/listing de réservations, listing des espaces) | Mesurer le temps de réponse sous charge modérée et vérifier la tenue des SLA internes. | k6 / artillery / outils de profiling Node |
| Tests de sécurité | Authentification, autorisations, validation d’entrée | Vérifier qu’aucune action critique n’est accessible sans droits, que les entrées sont validées et protégées (injections, brute-force). | Jest + outils d’analyse (lint, scanners) |

## Plan de test

| ID du test | Type de test | Fonctionnalité | Pré‑requis | Étapes | Résultats attendus |
| --- | --- | --- | --- | --- | --- |
| T-RES-001 | Unitaire | Création d’une réservation simple | BDD de test initialisée, use case `CreateReservationUseCase` accessible | 1) Appeler le use case avec un utilisateur valide, un espace disponible et un créneau libre. | La réservation est créée, un ID est retourné, l’objet contient les bonnes dates/heures et l’utilisateur associé. |
| T-RES-002 | Intégration | Conflit de réservation | BDD avec une réservation existante sur le créneau | 1) Appeler l’endpoint `POST /reservations` sur le même créneau. | L’API retourne une erreur métier (409 ou équivalent), aucun doublon n’est créé. |
| T-RES-003 | Fonctionnel API | Flux complet de réservation | BDD de test, utilisateur authentifié, token JWT valide | 1) Créer une réservation, 2) la modifier, 3) la consulter, 4) l’annuler. | Chaque étape renvoie un statut HTTP correct, les données en BDD sont cohérentes à chaque étape. |
| T-ADM-001 | Intégration | Création d’un espace | Rôle admin, endpoint `POST /admin/espaces` disponible | 1) Appeler la route avec un payload valide (nom, type, capacité). | Un nouvel espace est enregistré, visible dans la liste et dans le plan. |
| T-AUTH-001 | Unitaire / intégration | Authentification JWT | Utilisateur de test existant | 1) Appeler `POST /auth/login` avec des identifiants valides. 2) Consommer une route protégée avec le token. | Le login retourne un token valide, l’accès aux routes protégées est autorisé, les accès sans token sont refusés. |

## Rapport de tests (synthèse)

| Critères de complétion | Détail |
| --- | --- |
| Taux de réussite | Au moins 95% des tests basiques passés avec succès. 100% des tests critiques passés avec succès. Tests réalisés avec Jest (backend) et Cypress (frontend). |
| Performances | Temps de chargement des pages < 3s. |
| Date | 19/09/2025 |
| Responsable des tests | LADMIA Ryan |
| Objectifs | Vérifier les fonctionnalités, l’intégration, la performance, la sécurité et l’expérience utilisateur. |
| Résumé | Cas de tests exécutés : 72. Cas de tests réussis : 72. Cas de tests échoués : 0. Pourcentage de tests réussis : 100%. Pourcentage de tests échoués : 0%. |
| Analyse des tests | Les tests ont révélé que les fonctionnalités critiques s’exécutaient correctement et offrent une application performante et accessible. Des corrections peuvent être ajoutées pour optimiser davantage la sécurité et l’apparence. |

### Détail des cas de tests (extrait)

| ID | Type de test | Fonctionnalité | Commande | Résultats |
| --- | --- | --- | --- | --- |
| T-UNIT-ALL | Unitaire | Suite complète des tests unitaires backend | `npm run test:unit` ou `npm run test -- --runInBand` | Tous les tests unitaires passent avec succès, couverture conforme aux objectifs. |
| T-INT-API | Intégration | API réservations et espaces | `npm run test:integration` | Les endpoints principaux répondent avec les bons statuts et payloads, sans régression critique. |
| T-FUNC-API | Fonctionnel | Scénarios métier complets (réservation) | `npm run test:functional` | Tous les scénarios de bout en bout sont validés, y compris les cas d’erreur métier. |
| T-E2E-UI | End-to-end UI | Parcours utilisateur web | `npm run cypress:run` | Les parcours critiques (connexion, création de réservation, consultation) fonctionnent sans erreur. |
