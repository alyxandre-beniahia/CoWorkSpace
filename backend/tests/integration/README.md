# Tests d'intégration – CoWorkSpace Backend

Ce document décrit la procédure complète pour installer, configurer et exécuter les tests d'intégration du backend CoWorkSpace. En suivant ces étapes, vous pourrez reproduire l'environnement de test et comprendre son fonctionnement.

---

## 1. Vue d'ensemble

Les tests d'intégration vérifient que plusieurs composants de l'application fonctionnent ensemble correctement (contrôleurs, services, base de données). Contrairement aux tests unitaires, ils utilisent :

- Une **vraie base PostgreSQL** dédiée aux tests (`coworkspace_test`)
- Des **requêtes HTTP réelles** via `supertest` contre l'application NestJS
- Aucun mock de la base de données

La base de test est **distincte** de la base de développement (`coworkspace_dev`) pour éviter toute corruption des données de travail.

---

## 2. Prérequis

- **Node.js** 20+ et **npm**
- **PostgreSQL** 14+ (local ou via Docker)
- Les identifiants de connexion à la base (utilisateur, mot de passe, port)

---

## 3. Structure des fichiers

```
backend/
├── tests/
│   └── integration/
│       ├── README.md                 ← Ce fichier
│       ├── setup/
│       │   ├── test-app.ts           # Création de l'app NestJS + supertest
│       │   ├── test-db.ts            # Nettoyage des données de test
│       │   └── fixtures/
│       │       └── auth.fixtures.ts  # Données de test réutilisables
│       ├── auth/
│       │   └── auth.integration.spec.ts
│       ├── admin/
│       │   └── admin.integration.spec.ts
│       └── space/
│           └── space.integration.spec.ts
├── jest-integration.config.js        # Config Jest pour les tests d'intégration
├── package.json
└── prisma/
    └── schema.prisma
```

---

## 4. Installation des dépendances

### 4.1 Depuis la racine du projet

```bash
cd /chemin/vers/CoWorkSpace
```

### 4.2 Installer les dépendances du backend

```bash
cd backend
npm install
```

Les dépendances nécessaires aux tests d'intégration sont déjà présentes dans `package.json` :

| Package | Rôle |
|---------|------|
| `supertest` | Envoi de requêtes HTTP vers l'app NestJS |
| `@types/supertest` | Types TypeScript pour supertest |
| `@nestjs/testing` | Utilitaires de test NestJS |
| `jest` | Framework de test |
| `ts-jest` | Compilation TypeScript pour Jest |

### 4.3 Générer le client Prisma

```bash
npm run prisma:generate
```

---

## 5. Configuration de la base de données de test

### 5.1 Créer la base de données

La base `coworkspace_test` doit exister. Deux options :

**Option A – PostgreSQL local**

```bash
psql -U postgres -c "CREATE DATABASE coworkspace_test;"
```

**Option B – Docker (comme le projet CoWorkSpace)**

Si vous utilisez `docker-compose` pour la base :

```bash
# Depuis la racine du projet
docker compose up -d db
```

Puis créez la base de test (connexion à la base système `postgres` pour créer `coworkspace_test`) :

```bash
docker exec coworkspace-db psql -U cowork -d postgres -c "CREATE DATABASE coworkspace_test;"
```

### 5.2 Appliquer le schéma Prisma

```bash
cd backend
DATABASE_URL="postgresql://cowork:cowork_dev@localhost:5433/coworkspace_test" npx prisma db push
```

> **Note** : Adaptez `DATABASE_URL` à votre configuration (utilisateur, mot de passe, port, nom de la base).

### 5.3 Exécuter le seed

Le seed crée les rôles (`admin`, `member`) et les utilisateurs de test (`admin@test.com`, `member@test.com` avec le mot de passe `password123`).

```bash
DATABASE_URL="postgresql://cowork:cowork_dev@localhost:5433/coworkspace_test" npm run prisma:seed
```

Vous devriez voir : `Seed OK: rôles admin/member et utilisateurs admin@test.com / member@test.com (mdp: password123)`.

---

## 6. Variables d'environnement

Le script `test:integration` définit `DATABASE_URL` automatiquement. Si vous souhaitez la personnaliser :

**Option 1 – Variable d'environnement**

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/coworkspace_test"
npm run test:integration
```

**Option 2 – Fichier `.env.test`**

Copiez le fichier exemple :

```bash
cp backend/.env.test.example backend/.env.test
```

Éditez `backend/.env.test` avec vos paramètres, puis :

```bash
cd backend
dotenv -e .env.test -- npm run test:integration
```

> Si vous n'utilisez pas `dotenv`, le script `test:integration` dans `package.json` définit déjà `DATABASE_URL` pour la base de test.

---

## 7. Exécution des tests

### 7.1 Lancer tous les tests d'intégration

```bash
cd backend
npm run test:integration
```

### 7.2 Lancer un fichier de test spécifique

```bash
npm run test:integration -- auth/auth.integration.spec
```

### 7.3 Mode watch (re-exécution à chaque modification)

```bash
npm run test:integration -- --watch
```

---

## 8. Organisation des tests

### 8.1 Convention de nommage

- Fichiers : `*.integration.spec.ts`
- Exemple : `auth.integration.spec.ts`

### 8.2 Configuration Jest

Le fichier `jest-integration.config.js` à la racine du backend :

- `rootDir: '.'` : racine du backend
- `testRegex` : ne cible que les fichiers dans `tests/integration/` se terminant par `.integration.spec.ts`
- `--runInBand` : exécution séquentielle des tests (évite les conflits sur la base partagée)

### 8.3 Rôle des fichiers de setup

| Fichier | Rôle |
|---------|------|
| `test-app.ts` | Crée une instance NestJS avec `AppModule`, mocke `EmailService`, expose `request` (supertest) et `getAuthToken()` |
| `test-db.ts` | `cleanupAuthData(prisma)`, `cleanupAdminData(prisma)` : supprime les données créées par les tests tout en conservant le seed |
| `auth.fixtures.ts` | `createTestUser()`, `createEmailVerificationToken()`, `createPasswordResetToken()` |
| `admin.fixtures.ts` | `createPendingMember()`, `createMemberUnverified()`, `createTestSpace()`, `createTestEquipement()` |

---

## 9. Ajouter de nouveaux tests d'intégration

1. Créer un dossier par module : `tests/integration/nom-module/`
2. Créer un fichier `nom-module.integration.spec.ts`
3. Importer le setup :

```typescript
import { createTestApp, getAuthToken } from '../setup/test-app';
import { cleanupAuthData } from '../setup/test-db';
```

4. Utiliser `beforeAll` pour créer l'app, `afterEach` pour le cleanup si nécessaire.

---

## 10. Dépannage

### Erreur : "Database does not exist"

Créez la base `coworkspace_test` (voir section 5.1).

### Erreur : "relation does not exist" ou schéma obsolète

Réappliquez le schéma :

```bash
DATABASE_URL="postgresql://cowork:cowork_dev@localhost:5433/coworkspace_test" npx prisma db push
```

### Erreur : "admin@test.com" ou "member@test.com" introuvable

Réexécutez le seed :

```bash
DATABASE_URL="postgresql://cowork:cowork_dev@localhost:5433/coworkspace_test" npm run prisma:seed
```

### Tests qui échouent de manière intermittente

Vérifiez que les tests nettoient correctement leurs données et n'interfèrent pas entre eux. Le `cleanupAuthData` dans `afterEach` supprime les users avec les préfixes `it-` et `new-user-`.

---

## 11. Résumé des commandes

| Action | Commande |
|--------|----------|
| Installer les dépendances | `cd backend && npm install` |
| Générer Prisma | `npm run prisma:generate` |
| Créer la base de test | Voir section 5.1 |
| Appliquer le schéma | `DATABASE_URL="postgresql://.../coworkspace_test" npx prisma db push` |
| Exécuter le seed | `DATABASE_URL="postgresql://.../coworkspace_test" npm run prisma:seed` |
| Lancer les tests d'intégration | `npm run test:integration` |
