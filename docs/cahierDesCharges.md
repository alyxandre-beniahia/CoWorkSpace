# Cahier des Charges

## Application de réservation – CoWork’Space

---

## 1. Besoin Client

### 1.1 Contexte

CoWork’Space gère un espace de coworking composé de :

- 50 postes de travail en open space
- 4 salles de réunion
- Environ 80 membres actifs

La gestion actuelle des réservations est réalisée via des fichiers Excel, ce qui entraîne :

- des conflits de réservation
- un manque de visibilité sur les disponibilités en temps réel
- une charge administrative importante
- une expérience utilisateur peu fluide pour les membres

CoWork’Space souhaite mettre en place une **application web dédiée**, accessible aux membres et aux administrateurs, permettant une **gestion autonome, centralisée et fiable** des réservations.

---

### 1.2 Objectifs du projet

L’application devra permettre de :

- Éliminer les conflits de réservation
- Offrir une visibilité en temps réel sur les disponibilités
- Simplifier la gestion quotidienne des espaces
- Autonomiser les membres dans leurs réservations
- Améliorer l’expérience utilisateur globale
- Professionnaliser l’image de CoWork’Space

---

## 2. Public Cible

### 2.1 Membres (Coworkers)

Profil :

- Freelances, indépendants ou salariés nomades
- Utilisateurs réguliers ou ponctuels de l’espace

Besoins :

- Réserver rapidement un poste ou une salle
- Visualiser clairement les disponibilités
- Modifier ou annuler une réservation
- Accéder à l’historique de leurs réservations
- Recevoir des notifications par email

Contraintes :

- Peu de temps disponible
- Usage fréquent sur mobile
- Attente d’une interface simple et intuitive

---

### 2.2 Administrateurs CoWork’Space

Profil :

- Gestionnaires de l’espace de coworking

Besoins :

- Gérer les espaces (postes, salles, équipements)
- Valider et gérer les membres
- Visualiser l’occupation des espaces
- Réduire les tâches manuelles et les erreurs

Contraintes :

- Outil simple à prendre en main
- Intervention ponctuelle mais critique
- Fiabilité et cohérence des données

---

## 3. Périmètre Fonctionnel – MVP

Le MVP devra couvrir l’ensemble des fonctionnalités essentielles permettant une utilisation réelle de l’application.

### 3.1 Authentification et gestion des comptes

- Inscription des membres
- Validation manuelle des inscriptions par un administrateur
- Connexion / déconnexion
- Validation de l’email à l’inscription
- Réinitialisation du mot de passe par email
- Modification du profil utilisateur :
  - nom
  - prénom
  - téléphone
  - photo

---

### 3.2 Visualisation des espaces

- Vue globale des espaces (open space et salles de réunion)
- Représentation sous forme de plan simplifié
- Code couleur indiquant le statut :
  - disponible
  - réservé
  - occupé
- Affichage des informations clés :
  - capacité
  - équipements disponibles
  - type d’espace

---

### 3.3 Réservation des espaces

- Recherche et filtrage des espaces par :
  - type d’espace
  - capacité
  - équipements
- Vue calendrier hebdomadaire des disponibilités
- Création de réservation sur un créneau donné
- Réservation récurrente (ex : chaque mardi matin)
- Modification d’une réservation existante
- Annulation d’une réservation
- Gestion des événements privés / non privés
- Consultation de l’historique des réservations personnelles

---

### 3.4 Administration

- CRUD des espaces :
  - postes de travail
  - salles de réunion
  - équipements (vidéoprojecteur, écran, whiteboard, etc.)
- Gestion des membres :
  - liste des membres
  - statut actif / inactif
  - validation manuelle des inscriptions
- Tableau de bord simple :
  - nombre de réservations du jour
  - taux d’occupation hebdomadaire

---

### 3.5 Notifications

- Email de confirmation d'inscription
- Email de confirmation de réservation
- Email de rappel 24h avant la réservation
- Email lors de l’annulation d’une réservation

---

## 4. Contraintes Fonctionnelles

### 4.1 Règles de réservation

- Un espace ne peut pas être réservé par deux utilisateurs sur le même créneau
- Les créneaux réservés ne doivent plus être sélectionnables
- Les réservations privées doivent apparaître comme “occupées” sans afficher de détails
- Toute modification ou annulation doit être confirmée par l’utilisateur

---

### 4.2 Expérience utilisateur

- Réservation réalisable en moins de 3 actions principales
- Interface responsive (desktop, tablette, mobile)
- Messages d’erreur explicites et compréhensibles
- Feedback visuel et email après chaque action importante

---

### 4.3 Sécurité et cohérence

- Mots de passe stockés de manière sécurisée (hash)
- Protection contre les injections SQL
- Accès restreint aux fonctionnalités d’administration
- Données cohérentes et centralisées

---

### 4.4 Hors périmètre MVP

Les fonctionnalités suivantes ne sont pas incluses dans le MVP :

- Paiement en ligne
- Intégration agenda externe (Google / Outlook)
- Gestion multi-sites
- Application mobile native

---
