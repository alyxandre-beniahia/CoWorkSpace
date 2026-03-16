# Guide détaillé du backend CoWork'Space

Ce document parcourt **tous les fichiers du backend** dans un but éducatif : rôle de chaque fichier, concepts NestJS/DDD/Prisma, et flux de données.

---

## 1. Vue d’ensemble

Le backend est une API **NestJS** (Node.js) qui :

- expose des routes HTTP (auth, espaces) ;
- s’appuie sur **Prisma** pour la base PostgreSQL ;
- suit une structure **DDD** (Domain-Driven Design) pour les modules métier (auth, space).

**Organisation des dossiers (vue simplifiée) :**

```
backend/
├── prisma/              # Schéma BDD + migrations + seed
├── src/
│   ├── main.ts          # Point d’entrée
│   ├── app.module.ts    # Module racine
│   ├── app.controller.ts
│   ├── database/        # Accès base de données (PrismaService + module global)
│   ├── auth/            # Contexte "Authentification"
│   ├── space/           # Contexte "Espaces"
│   ├── reservation/     # Contexte "Réservations"
│   ├── notification/    # Contexte "Notifications"
│   ├── admin/           # Cas d’usage d’administration
│   ├── shared/          # Garde communs, Result<T>, etc.
│   ├── application/     # Use cases transverses (si besoin)
│   ├── domain/          # Types/entités transverses (si besoin)
│   └── infrastructure/  # Implémentations techniques transverses (si besoin)
└── package.json
```

Chaque **contexte métier principal** (`auth`, `space`, `reservation`, `notification`, `admin`) suit lui‑même le triptyque **domain / application / infrastructure**, conformément aux règles DDD du projet.

---

## 2. Point d’entrée et configuration

### 2.1 `src/main.ts`

**Rôle :** point d’entrée de l’application. C’est ici que NestJS démarre.

- `NestFactory.create(AppModule)` : crée l’app à partir du module racine.
- `app.enableCors(...)` : autorise les requêtes depuis le front (ex. `http://localhost:5173`). Sans CORS, le navigateur bloquerait les appels depuis une autre origine.
- `app.listen(port, '0.0.0.0')` : écoute sur toutes les interfaces pour que Docker (mapping de ports) fonctionne. En local, `localhost` suffirait.

**Concepts :** bootstrap, CORS, host réseau.

---

### 2.2 `src/app.module.ts`

**Rôle :** module **racine** qui déclare ce que l’application contient.

```ts
@Module({
  imports: [PrismaModule, AuthModule, SpaceModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
```

- **imports** : on “branche” les autres modules. Chaque module apporte ses controllers, providers, etc.
- **controllers** : contrôleur racine (route `/`).
- **providers** : services globaux au niveau racine (ici aucun, tout est dans les sous-modules).

**Concepts :** modularité NestJS, agrégation des fonctionnalités.

---

### 2.3 `src/app.controller.ts`

**Rôle :** contrôleur minimal pour la route **racine** `GET /`.

- `@Controller()` sans préfixe → routes sur `/`.
- `@Get()` → `GET /` renvoie `{ message: "CoWork'Space API – ..." }`.

Utile pour vérifier que l’API répond (health check, lien dans la doc).

---

### 2.4 `package.json` et `tsconfig.json`

- **package.json** : dépendances (NestJS, Prisma, JWT, Passport, bcrypt), scripts (`build`, `start`, `prisma:migrate`, `prisma:seed`, `test`).
- **tsconfig.json** : options TypeScript (module CommonJS, décorateurs pour NestJS, `strictNullChecks`, etc.).

---

## 3. Prisma : accès à la base de données

### 3.1 `prisma/schema.prisma`

**Rôle :** décrit le **modèle de données** (tables, relations, enums) et génère le client Prisma.

- **generator** : génère le client TypeScript (`@prisma/client`).
- **datasource** : connexion PostgreSQL via `DATABASE_URL`.
- **enums** : `SpaceType`, `SpaceStatus`, `TokenType`, etc. — évitent les chaînes magiques.
- **models** : `Role`, `User`, `Session`, `UserToken`, `Space`, `Equipement`, `SpaceEquipement`, `Reservation`, `NotificationLog`. Les relations (`@relation`, `references`) définissent les clés étrangères.

**Concepts :** ORM, schéma déclaratif, migrations (fichiers SQL dans `prisma/migrations/`).

---

### 3.2 `src/database/prisma.service.ts`

**Rôle :** **service injectable** qui étend `PrismaClient` et gère la connexion au cycle de vie NestJS.

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- Au démarrage du module : connexion à la BDD.
- À l’arrêt : déconnexion propre.

**Concepts :** injection de dépendances, lifecycle hooks NestJS.

---

### 3.3 `src/database/prisma.module.ts`

**Rôle :** enregistre `PrismaService` et le rend disponible **partout** grâce à `@Global()`.

- `providers: [PrismaService]` : le service est créé par NestJS.
- `exports: [PrismaService]` : les autres modules peuvent l’importer.
- `@Global()` : inutile de ré-importer `PrismaModule` dans chaque module qui utilise Prisma.

**Concepts :** module global, réutilisation d’un seul client BDD.

---

### 3.4 `prisma/seed.ts`

**Rôle :** script exécuté avec `npm run prisma:seed` pour **remplir la BDD** avec des données de test.

- Crée ou met à jour les rôles `admin` et `member` (`upsert` sur `slug`).
- Hash le mot de passe avec **bcrypt** (comme en production).
- Crée deux utilisateurs : `admin@test.com` et `member@test.com` (mot de passe `password123`).

**Concepts :** seed, upsert, hash de mots de passe. À lancer après les migrations si la BDD est vide.

---

## 4. Module Auth (authentification)

Le module Auth gère la **connexion** (login) et l’**utilisateur courant** (GET /me), avec JWT et Passport.

### 4.1 Structure du module Auth

- **dto/** : objets pour les entrées API (login).
- **application/** : “use cases” (cas d’usage) — logique métier.
- **infrastructure/** : stratégie JWT et guard (couche technique).
- **auth.controller.ts** : routes HTTP.
- **auth.module.ts** : déclaration du module.

---

### 4.2 `src/auth/dto/login.dto.ts`

**Rôle :** définit la **forme des données** envoyées au login.

```ts
export class LoginDto {
  email: string;
  password: string;
}
```

Le corps de `POST /auth/login` est typé ainsi. On pourrait y ajouter des décorateurs de validation (`class-validator`) pour refuser les requêtes invalides.

**Concepts :** DTO (Data Transfer Object), typage des entrées API.

---

### 4.3 `src/auth/application/login.use-case.ts`

**Rôle :** **cas d’usage** “Se connecter”. Contient toute la logique du login.

1. Chercher l’utilisateur par email (`prisma.user.findUnique`).
2. Vérifier qu’il existe et qu’il est actif (`isActive`).
3. Comparer le mot de passe avec **bcrypt.compare** (jamais de comparaison en clair).
4. Si tout est ok : construire un **JWT** (payload : `sub`, `email`, `role`) avec `JwtService.sign`, expiration 7 jours.
5. Retourner `{ access_token }`. En cas d’erreur : `UnauthorizedException`.

**Concepts :** use case, séparation logique métier / contrôleur, sécurité (hash, JWT).

---

### 4.4 `src/auth/application/get-me.use-case.ts`

**Rôle :** cas d’usage “Récupérer l’utilisateur courant”. Appelé après que le JWT a été validé.

- Reçoit le `userId` (issu du JWT, donc déjà fiable).
- Charge l’utilisateur avec `prisma.user.findUnique` en ne sélectionnant que les champs nécessaires (id, email, firstname, lastname, role.slug).
- Si absent : `NotFoundException`. Sinon : retourne un objet typé `MeResult`.

**Concepts :** use case “lecture”, sélection minimale des champs (sécurité et performance).

---

### 4.5 `src/auth/infrastructure/jwt.strategy.ts`

**Rôle :** **stratégie Passport** “jwt”. Dit à Passport comment lire et valider le JWT.

- `ExtractJwt.fromAuthHeaderAsBearerToken()` : récupère le token dans l’en-tête `Authorization: Bearer <token>`.
- `secretOrKey` : même secret que pour la signature (cohérence avec `JwtModule`).
- `validate(payload)` : après vérification de la signature et de l’expiration, Passport appelle cette méthode. On retourne un objet `{ userId, email, role }` qui sera attaché à `req.user` pour les routes protégées.

**Concepts :** Passport, stratégie JWT, payload → objet utilisateur.

---

### 4.6 `src/auth/infrastructure/jwt-auth.guard.ts`

**Rôle :** **guard** qui protège les routes : exige un JWT valide, sauf si la route est marquée “publique”.

- Étend `AuthGuard('jwt')` : utilise la stratégie `jwt` définie plus haut.
- Utilise le **Reflector** pour lire un métadonnée `IS_PUBLIC_KEY`. Si la route est marquée publique (`@Public()` ou équivalent), le guard laisse passer sans JWT.
- Sinon : `super.canActivate(context)` déclenche la stratégie JWT ; si pas de token ou token invalide, la requête est rejetée (401).

**Concepts :** guard, protection des routes, métadonnées (décorateurs personnalisés possibles).

---

### 4.7 `src/auth/auth.controller.ts`

**Rôle :** expose les **routes HTTP** du domaine auth.

- **Préfixe** : `@Controller('auth')` → toutes les routes sont sous `/auth`.
- `POST /auth/login` : reçoit un `LoginDto`, appelle `LoginUseCase.run(dto)`, renvoie `{ access_token }`. Pas de guard : route publique.
- `GET /auth/me` : `@UseGuards(JwtAuthGuard)` → seul un JWT valide permet d’accéder à la route. Le guard remplit `req.user` ; le contrôleur passe `req.user.userId` à `GetMeUseCase.run()` et renvoie le résultat.

**Concepts :** contrôleur, délégation aux use cases, guard sur une route.

---

### 4.8 `src/auth/auth.module.ts`

**Rôle :** **déclaration du module** Auth : enregistre tout ce dont NestJS a besoin pour ce contexte.

- **imports** : `PassportModule` (stratégies), `JwtModule` (signature et vérification des JWT). La clé et l’expiration sont les mêmes que dans la stratégie.
- **controllers** : `AuthController`.
- **providers** : `LoginUseCase`, `GetMeUseCase`, `JwtStrategy`. NestJS les instancie et injecte les dépendances (PrismaService, JwtService, etc.).
- **exports** : `JwtModule` pour que d’autres modules puissent utiliser `JwtService` si besoin.

**Concepts :** module NestJS, encapsulation du domaine “auth”.

---

## 5. Module Space (espaces) et autres contextes métier

Le module Space gère la **lecture** des espaces (liste, détail, équipements) avec **filtres**, sans authentification. Il est structuré en **Domain / Application / Infrastructure** (DDD), tout comme les modules `reservation`, `notification` et `admin` qui appliquent la même séparation de couches pour leurs propres cas d’usage.

### 5.1 Domain (définitions métier)

#### `src/space/domain/space-list.filters.ts`

**Rôle :** définit le **type des filtres** pour la liste d’espaces (type d’espace, équipement, capacité min/max). Utilise les enums Prisma pour rester aligné avec la BDD.

**Concepts :** types métier, pas de dépendance à Prisma dans les types (sauf import des enums pour cohérence).

---

#### `src/space/domain/space.repository.interface.ts`

**Rôle :** **interface** du “repository” des espaces : contrat que doit respecter toute implémentation (ici l’implémentation Prisma).

- `list(filters)` : retourne une liste d’espaces (forme `SpaceListItem`).
- `findById(id)` : retourne un espace avec équipements ou `null`.

Les types de retour (`SpaceListItem`, `SpaceWithEquipements`) décrivent exactement ce que l’API expose. Les use cases et le contrôleur dépendent de cette interface, pas de Prisma directement.

**Concepts :** interface de repository, inversion de dépendance, formes de données exposées.

---

### 5.2 Application (use cases)

#### `src/space/application/list-spaces.use-case.ts`

**Rôle :** cas d’usage “Lister les espaces (avec filtres)”. Délègue au repository et retourne la liste. Logique métier minimale ici ; l’essentiel est dans le repository (filtres, tri).

**Concepts :** use case simple, délégation au repository.

---

#### `src/space/application/get-space-by-id.use-case.ts`

**Rôle :** cas d’usage “Obtenir un espace par ID”. Appelle le repository ; si aucun espace → `NotFoundException`, sinon retourne l’objet.

**Concepts :** use case “lecture”, gestion d’erreur métier (404).

---

#### `src/space/application/list-equipements.use-case.ts`

**Rôle :** cas d’usage “Lister les équipements” (pour les filtres côté front). Utilise directement `PrismaService` (pas de repository dédié pour cette lecture simple). Retourne `{ id, name }[]`.

**Concepts :** use case simple, accès BDD direct quand le domaine est très limité.

---

### 5.3 Infrastructure (implémentation du repository)

#### `src/space/infrastructure/space.repository.ts`

**Rôle :** **implémentation** de `ISpaceRepository` avec Prisma.

- **list(filters)** : construit un `where` Prisma à partir des filtres (type, capacityMin/Max, equipementId via la relation `spaceEquipements`). `findMany` avec `include` des équipements, puis mapping vers `SpaceListItem` (noms d’équipements en tableau de strings).
- **findById(id)** : `findUnique` avec `include` des équipements, mapping vers `SpaceWithEquipements` (équipements en `{ name }[]`).

**Concepts :** repository concret, Prisma `where` / `include`, mapping modèle BDD → type exposé.

---

### 5.4 Contrôleur et module

#### `src/space/space.controller.ts`

**Rôle :** expose les **routes HTTP** du domaine space.

- **Préfixe** : `@Controller('spaces')` → routes sous `/spaces`.
- `GET /spaces/equipments` : liste des équipements (route “fixe” déclarée avant `:id` pour éviter que `equipments` soit pris pour un id).
- `GET /spaces` : liste des espaces. Les query params (`type`, `equipementId`, `capacityMin`, `capacityMax`) sont lus et convertis (ex. strings → nombres) puis passés à `ListSpacesUseCase.run(filters)`.
- `GET /spaces/:id` : détail d’un espace via `GetSpaceByIdUseCase.run(id)`.

Aucun guard : ces routes sont **publiques**.

**Concepts :** ordre des routes (équipments avant `:id`), transformation des query params, délégation aux use cases.

---

#### `src/space/space.module.ts`

**Rôle :** déclaration du module Space.

- **controllers** : `SpaceController`.
- **providers** : tous les use cases + `SpaceRepository`. NestJS injecte le repository dans les use cases.

**Concepts :** module NestJS, enregistrement des use cases et du repository.

---

## 6. Flux de données (résumé)

1. **Requête HTTP** → NestJS route vers le bon **controller** (Auth ou Space).
2. **Controller** : extrait paramètres/body/query, appelle un **use case** (ou plusieurs).
3. **Use case** : orchestre la logique, utilise un **repository** ou **PrismaService**, retourne un résultat ou lance une exception (NestJS la convertit en code HTTP).
4. **Repository** (quand il existe) : parle à la BDD via **PrismaService**, mappe les modèles Prisma vers les types du domaine.
5. **Réponse** : le controller renvoie le résultat au client (souvent en JSON).

Pour les routes protégées (ex. `GET /auth/me`) :

- La requête passe d’abord par le **JwtAuthGuard**.
- Le guard utilise la **JwtStrategy** pour valider le token et remplir `req.user`.
- Puis le controller et le use case s’exécutent avec `req.user.userId`.

---

## 7. Fichiers de tests (`.spec.ts`)

Les fichiers `*.spec.ts` (auth et space) utilisent **Jest** et **@nestjs/testing** :

- **Test.createTestingModule** : crée un mini-module NestJS avec des **mocks** (Prisma, JwtService, repository) pour isoler le use case.
- Les tests vérifient les cas “happy path” et les erreurs (utilisateur inexistant, mot de passe faux, espace non trouvé, etc.).

**Concepts :** tests unitaires, mocking, isolation des use cases.

---

## 8. Récapitulatif par fichier

| Fichier | Rôle en une phrase |
|--------|---------------------|
| `main.ts` | Démarre l’app, CORS, écoute HTTP. |
| `app.module.ts` | Module racine : importe Prisma, Auth, Space et le controller racine. |
| `app.controller.ts` | Route `GET /` de bienvenue. |
| `prisma/schema.prisma` | Modèle de données et génération du client Prisma. |
| `prisma/seed.ts` | Données initiales (rôles, utilisateurs de test). |
| `src/database/prisma.service.ts` | Client BDD injectable, connexion/déconnexion. |
| `src/database/prisma.module.ts` | Module global qui expose PrismaService. |
| `auth/dto/login.dto.ts` | Type des données de login. |
| `auth/application/login.use-case.ts` | Logique : vérifier identifiants, émettre JWT. |
| `auth/application/get-me.use-case.ts` | Logique : retourner l’utilisateur courant par ID. |
| `auth/infrastructure/jwt.strategy.ts` | Passport : comment valider le JWT et remplir `req.user`. |
| `auth/infrastructure/jwt-auth.guard.ts` | Guard : exiger un JWT sauf route publique. |
| `auth/auth.controller.ts` | Routes `POST /auth/login` et `GET /auth/me`. |
| `auth/auth.module.ts` | Déclaration du module Auth (JWT, Passport, use cases, controller). |
| `space/domain/space-list.filters.ts` | Type des filtres de liste. |
| `space/domain/space.repository.interface.ts` | Contrat du repository (list, findById). |
| `space/application/list-spaces.use-case.ts` | Use case : lister les espaces avec filtres. |
| `space/application/get-space-by-id.use-case.ts` | Use case : détail d’un espace. |
| `space/application/list-equipements.use-case.ts` | Use case : lister les équipements. |
| `space/infrastructure/space.repository.ts` | Implémentation Prisma du repository. |
| `space/space.controller.ts` | Routes `GET /spaces`, `GET /spaces/equipments`, `GET /spaces/:id`. |
| `space/space.module.ts` | Déclaration du module Space. |

Tu peux t’appuyer sur ce guide pour naviguer dans le code et comprendre chaque fichier en détail.
