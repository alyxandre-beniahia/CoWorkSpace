# Tests fonctionnels CoWorkSpace

Les tests fonctionnels couvrent des **parcours utilisateur complets** (plusieurs endpoints enchaînés) sur une base de données dédiée.

## Base de données dédiée

- **Base** : `coworkspace_functional`
- **URL** : `postgresql://cowork:cowork_dev@localhost:5433/coworkspace_functional`
- **Données** : uniquement des données de test (seed + données créées par les tests)
- **Nettoyage** : `afterEach` supprime les données de test (users `it-*`, espaces `IT-*`, réservations soft delete)

## Procédure de création de la base

### Option rapide (si la base existe déjà)

```bash
cd backend
npm run db:functional:setup   # migrations + seed
npm run test:functional
```

### Procédure complète (première fois)

1. **Créer la base** (si nécessaire) :

```bash
psql -h localhost -p 5433 -U cowork -d postgres -c "CREATE DATABASE coworkspace_functional;"
```

2. **Migrations et seed** :

```bash
cd backend
npm run db:functional:setup
```

3. **Exécuter les tests** :

```bash
npm run test:functional
```

## Scénarios

| Fichier | Parcours |
|---------|----------|
| `inscription-flow.functional.spec.ts` | Inscription complète ; 400 email dupliqué ; 400/404 verify-email ; 401 login mauvais MDP |
| `profil-flow.functional.spec.ts` | PATCH /me (firstname, lastname, phone) ; 401 sans token |
| `password-flow.functional.spec.ts` | change-password ; forgot/reset ; 400/401/404 erreurs |
| `admin-flow.functional.spec.ts` | Membres + espaces CRUD ; 401/403/404 |
| `space-flow.functional.spec.ts` | Health, equipments, list, filtres, détail ; 404 id inexistant |
| `reservation-flow.functional.spec.ts` | CRUD, récurrence, scope=all, isPrivate, masquage privé, PATCH complet ; 400/401/403/404/409 |

## Configuration

- **Jest** : `jest-functional.config.js` (testRegex : `*.functional.spec.ts`)
- **Services** : code métier réel, `EmailService` mocké
- **Exécution** : `--runInBand` (séquentiel pour éviter les conflits sur la base)
