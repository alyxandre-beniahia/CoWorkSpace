# CoWork'Space

Application web de gestion des réservations d’un espace de coworking (50 postes, 4 salles de réunion).

- **Frontend** : React + TypeScript (Vite)
- **Backend** : Node.js + NestJS, Prisma, PostgreSQL
- **Environnement de dev** : Docker (PostgreSQL, backend, frontend)

## Structure du dépôt

```
.
├── frontend/          # Application React (Vite)
├── backend/           # API NestJS + Prisma
├── docs/              # Conception (cas d’usage, user stories)
├── docker-compose.yml
├── .env.example       # Modèle de variables (copier en .env)
└── README.md
```

## Variables d'environnement

- **`.env.example`** (versionné) : liste des variables avec valeurs par défaut pour le dev. À copier en `.env` et adapter.
- **`.env`** : non versionné (dans `.gitignore`). Docker Compose charge automatiquement le `.env` à la racine au lancement.
- En dev, les valeurs de `.env.example` suffisent ; pour la prod, définir des secrets réels (notamment `JWT_SECRET`, mots de passe DB).

## Démarrage avec Docker

### Prérequis

- Docker et Docker Compose (v2)
- Fichier `.env` à la racine (copier depuis `.env.example` et adapter si besoin)

```bash
cp .env.example .env
```

### Lancer l’environnement

```bash
docker compose up --build
```

- **Frontend** : http://localhost:5173  
- **Backend API** : http://localhost:3002  
- **PostgreSQL** : port `5433` sur l’hôte (pour clients externes)

### Arrêter et supprimer les conteneurs

```bash
docker compose down
```

Pour supprimer aussi les volumes (données PostgreSQL) :

```bash
docker compose down -v
```

### Port déjà utilisé

Si Docker indique « address already in use » pour le backend (port 3002), un autre processus utilise ce port. Pour voir lequel : `lsof -i :3002`. Pour libérer le port : arrêter le processus concerné ou modifier le port dans `docker-compose.yml` (ex. `3003:3000`).

## Migrations Prisma

Après avoir modifié `backend/prisma/schema.prisma`, exécuter les migrations depuis le conteneur backend :

```bash
docker compose exec backend npx prisma migrate dev --name nom_de_la_migration
```

Générer le client Prisma après un pull ou changement de schéma :

```bash
docker compose exec backend npx prisma generate
```

## Développement sans Docker

- **Backend** : Node 20+, `cd backend && npm install && npx prisma generate && npm run start:dev`. PostgreSQL doit être accessible (ex. `DATABASE_URL` pointant vers `localhost:5433` si la DB tourne dans Docker).
- **Frontend** : `cd frontend && npm install && npm run dev`. Configurer `VITE_API_URL=http://localhost:3002`.

## Documentation de conception

Voir le dossier [docs/](docs/) pour le diagramme de cas d’utilisation et les user stories.
