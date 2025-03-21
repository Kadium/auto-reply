# POC de Réponse Automatique IA

Ce projet est une Preuve de Concept (POC) qui démontre la capacité de générer des réponses automatiques à des messages
entrants en se basant sur des templates prédéfinis et l'API OpenAI. Il s'agit d'une application web simple avec un
frontend React et un backend Node.js.

## Présentation du Projet

Le POC de Réponse Automatique IA vise à tester la faisabilité des réponses automatiques basées sur l'IA pour les
messages entrants :

- Les **messages entrants** sont générés via un script à l'aide de l'IA et stockés dans un fichier JSON
- Les **modèles de réponse** sont définis dans le fichier JSON (server/templates/templates.json)
- L'application interroge l'API OpenAI pour déterminer si un message correspond à l'un de nos modèles de réponse
  prédéfinis
- En cas de correspondance, l'application propose une **réponse automatique** construite à partir du modèle

Ce projet n'inclut pas d'authentification ou de persistance en base de données car il s'agit principalement d'une POC.

## Fonctionnalités

1. **Génération de messages entrants fictifs**

   - Un script crée des messages aléatoires (support client, demandes d'information, etc.) et les stocke dans un fichier
     JSON
   - Les utilisateurs peuvent déclencher ce script via un bouton ou en ligne de commande

2. **Affichage des messages entrants**

   - Le frontend React fournit une interface minimaliste :
     - Une barre latérale listant les messages non traités (nouveaux messages)
     - Une zone de lecture/édition pour le message sélectionné

3. **Réponse automatique**

   - Les utilisateurs peuvent cliquer sur un bouton "Réponse Auto"
   - L'application interroge l'API OpenAI pour identifier si le message entrant correspond à l'un des modèles de réponse
   - Si c'est le cas, une réponse est automatiquement générée en se basant sur le modèle et affichée dans l'éditeur

4. **Suppression de message**
   - Une fois la réponse validée (ou simplement lorsqu'on clique sur "Envoyer"), le message est retiré de la liste (file
     d'attente)

## Installation et Configuration

### Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)
- Clé API OpenAI

### Installation

1. Cloner le dépôt :

   ```
   git clone <URL-du-dépôt>
   cd auto-reply
   ```

2. Installer les dépendances :

   ```
   npm run install:all
   ```

3. Configurer les variables d'environnement :

   - Créer un fichier `.env` dans le répertoire server ou renommer le fichier `.env.example` fourni
   - Ajouter votre clé API OpenAI :
     ```
     PORT=3001
     OPENAI_API_KEY=votre_clé_api_openai_ici
     ```

4. Démarrer le serveur de développement :

   ```
   npm run dev
   ```

5. Générer des messages de test :
   - Via l'interface : Cliquer sur le bouton "Générer des messages de test"
   - Via ligne de commande : `npm run generate [nombre]`

## Structure du Projet

```
auto-reply/
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Composants React
│   │   ├── App.jsx       # Composant principal
│   │   └── index.js      # Point d'entrée
│   └── package.json      # Dépendances frontend
├── server/               # Backend Node.js
│   ├── scripts/
│   │   └── generate-messages.js  # Script pour générer des messages de test
│   ├── templates/
│   │   └── templates.json        # Modèles de réponse
│   ├── data/
│   │   └── messages.json         # Stockage des messages générés
│   ├── server.js                 # Serveur Express
│   └── package.json              # Dépendances backend
├── README.fr.md          # Documentation du projet (en français)
└── package.json          # package.json racine avec les scripts
```

## Stack Technique

- **Frontend** : React, Tailwind CSS, DaisyUI
- **Backend** : Node.js, Express
- **API** : OpenAI API (GPT-3.5 Turbo)
- **Stockage de données** : Fichiers JSON locaux (pas de base de données)

## Utilisation

1. Démarrer l'application avec `npm run dev`
2. Générer des messages de test via l'interface ou la ligne de commande
3. Sélectionner un message dans la barre latérale
4. Cliquer sur "Réponse Auto" pour générer une réponse alimentée par l'IA
5. Modifier la réponse si nécessaire
6. Cliquer sur "Envoyer" pour marquer le message comme traité (ce qui le supprime de la boîte de réception)
