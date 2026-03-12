# Dossier de Conception – CoWork'Space

Ce dossier rassemble les livrables de conception demandés pour le projet.

## Contenu

| Fichier | Description |
|---------|-------------|
| `01-diagramme-cas-utilisation.puml` | **Diagramme de cas d’utilisation** – Acteurs (Membre, Administrateur, Système Email) et fonctionnalités principales du MVP |
| `02-user-stories.md` | **User stories** – Format tableau (En tant que / Je veux / Afin de / Critères), aligné au cahier des charges |
| `04-charte-graphique.md` | **Charte graphique** – Palette, typographie, statuts des espaces, patterns UI, stack (React 19, Tailwind v4, shadcn, FullCalendar) |
| `05-plan-attaque.md` | **Plan d'attaque** – Découpage par logique métier, features autonomes, répartition 2 devs / 4 jours, plan jour par jour, règles Git |

## Diagramme de cas d’utilisation

- Format : **PlantUML** (`.puml`).
- Pour générer l’image : [PlantUML en ligne](https://www.plantuml.com/plantuml/uml) (coller le contenu du fichier) ou extension **PlantUML** dans VS Code / Cursor.
- Ajustements par rapport au CDC :
  - Acteur **Membre** (au lieu d’« Utilisateur ») pour coller au cahier des charges.
  - **Valider email à l’inscription** et **Se déconnecter** ajoutés.
  - **Recherche globale** (fonctionnalité transverse) ajoutée.
  - Liens vers le **Système Email** pour les notifications (inscription, réservation, modification, annulation).

## User stories

Le fichier `02-user-stories.md` reprend les user stories par module (Authentification, Visualisation, Réservation, Transverses, Administration, Notifications) et est aligné sur le cahier des charges. Vous pouvez le synchroniser avec votre fichier `CoWorkSpace-UserStory.numbers` (export ou copier-coller) pour garder une seule source de vérité.

## Suite du livrable conception

À compléter dans ce dossier selon la liste des livrables :

- **Maquettes** : wireframes des 4–5 écrans principaux (fichiers images ou outil de maquettage).
- **MCD/MLD** : modèle de données simplifié.
- **Choix techniques** : stack (front/back, BDD, etc.) et justification (1 page max).
