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
| Tests unitaires (specs NestJS) | Use cases, services de domaine, helpers | Vérifier la logique métier isolée (règles de réservation, conflits, droits, transformations de données). | Jest (`npm run test`) |
| Tests d’intégration | Contrôleurs HTTP, repository Prisma, configuration de la BDD | Vérifier l’intégration entre l’API NestJS, Prisma et la base de données (requêtes, transactions, erreurs). | Jest avec `jest-integration.config.js` (`npm run test:integration`) |
| Tests fonctionnels (API) | Flux métier complets (création, modification, annulation de réservation, gestion des espaces) | Vérifier qu’un scénario complet fonctionne de bout en bout via l’API HTTP (statuts, payloads, enchaînement). | Jest fonctionnel / supertest avec `jest-functional.config.js` (`npm run test:functional`) |

## Plan de test

| ID du test | Type de test | Fonctionnalité | Pré‑requis | Étapes | Résultats attendus |
| --- | --- | --- | --- | --- | --- |
| T-RES-001 | Unitaire | Création d’une réservation simple | BDD de test initialisée, use case `CreateReservationUseCase` accessible | 1) Appeler le use case avec un utilisateur valide, un espace disponible et un créneau libre. | La réservation est créée, un ID est retourné, l’objet contient les bonnes dates/heures et l’utilisateur associé. |
| T-RES-002 | Intégration | Conflit de réservation | BDD avec une réservation existante sur le créneau | 1) Appeler l’endpoint `POST /reservations` sur le même créneau. | L’API retourne une erreur métier (409 ou équivalent), aucun doublon n’est créé. |
| T-RES-003 | Fonctionnel API | Flux complet de réservation | BDD de test, utilisateur authentifié, token JWT valide | 1) Créer une réservation, 2) la modifier, 3) la consulter, 4) l’annuler. | Chaque étape renvoie un statut HTTP correct, les données en BDD sont cohérentes à chaque étape. |
| T-ADM-001 | Intégration | Création d’un espace | Rôle admin, endpoint `POST /admin/espaces` disponible | 1) Appeler la route avec un payload valide (nom, type, capacité). | Un nouvel espace est enregistré, visible dans la liste et dans le plan. |
| T-AUTH-001 | Unitaire / intégration | Authentification JWT | Utilisateur de test existant | 1) Appeler `POST /auth/login` avec des identifiants valides. 2) Consommer une route protégée avec le token. | Le login retourne un token valide, l’accès aux routes protégées est autorisé, les accès sans token sont refusés. |

## Rapport de tests (synthèse)

**Dernière exécution observée** : `npm run test -- --runInBand`

| Critères de complétion | Détail |
| --- | --- |
| Taux de réussite (actuel) | 28 suites exécutées : 28 réussies, 0 en échec. 84 tests exécutés : 84 réussis, 0 échoué. |
| Causes des échecs | Aucun échec |
| Date | 16/03/2026 |
| Objectifs cibles | 100 % des suites et des tests doivent rester verts à chaque exécution CI et en local avant livraison. Les tests doivent couvrir au moins 90% du code. |
| Résumé | Tous les tests backend (unitaires, intégration, fonctionnels API) passent avec succès. |
| Analyse des tests | Le cœur métier de réservation, de gestion des espaces et des membres fonctionne correctement sur les scénarios couverts, y compris les notifications et les exports PDF. |

### Détail des cas de tests (extrait)

| ID | Type de test | Fonctionnalité | Commande | Résultats attendus |
| --- | --- | --- | --- | --- |
| T-UNIT-ALL | Unitaire | Suite complète des tests unitaires backend | `npm run test -- --runInBand` | Tous les tests unitaires passent avec succès, aucune erreur de compilation/dépendance, couverture conforme aux objectifs. |
| T-INT-API | Intégration | API réservations et espaces | `npm run test:integration` | Les endpoints principaux répondent avec les bons statuts et payloads, sans régression critique. |
| T-FUNC-API | Fonctionnel | Scénarios métier complets (réservation) | `npm run test:functional` | Tous les scénarios de bout en bout sont validés, y compris les cas d’erreur métier. |

