# Guide d'Installation Complet - RDS Viewer Anecoop v3.0.27

---

## 📋 Table des matières

1. [Prérequis système](#1-prérequis-système)
2. [Installation standard avec l'installeur](#2-installation-standard-avec-linstalleur)
3. [Installation personnalisée](#3-installation-personnalisée)
4. [Installation silencieuse (déploiement entreprise)](#4-installation-silencieuse-déploiement-entreprise)
5. [Installation portable (sans installeur)](#5-installation-portable-sans-installeur)
6. [Première configuration](#6-première-configuration)
7. [Vérification de l'installation](#7-vérification-de-linstallation)
8. [Démarrage de l'application](#8-démarrage-de-lapplication)
9. [Dépannage](#9-dépannage)

---

## 1. Prérequis système

### Configuration minimale requise

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| **Système d'exploitation** | Windows 10 (64-bit) | Windows 11 (64-bit) |
| **Processeur** | Intel Core i3 / AMD équivalent | Intel Core i5 / AMD Ryzen 5 |
| **Mémoire vive (RAM)** | 4 GB | 8 GB ou plus |
| **Espace disque** | 500 MB | 1 GB |
| **Résolution d'écran** | 1280x768 | 1920x1080 |
| **Connexion réseau** | Requise pour l'activation | Haut débit recommandé |

### Logiciels requis

- **Aucun logiciel supplémentaire requis** : RDS Viewer Anecoop inclut tous les composants nécessaires
- **Permissions** : Droits d'administrateur pour l'installation standard

### Vérification préalable

Avant de commencer l'installation, assurez-vous que :

✅ Votre système répond aux exigences minimales  
✅ Vous disposez de droits d'administrateur (pour installation standard)  
✅ Votre pare-feu/antivirus ne bloque pas l'installeur  
✅ Vous avez au moins 1 GB d'espace disque libre  

> **💡 Astuce** : Pour vérifier votre version de Windows, appuyez sur `Windows + R`, tapez `winver` et cliquez sur OK.

---

## 2. Installation standard avec l'installeur

### Étape 1 : Téléchargement

1. **Téléchargez** l'installeur officiel :
   - Fichier : `RDS-Viewer-Anecoop-3.0.27-Setup.exe`
   - Taille : ~150 MB

2. **Vérifiez** l'intégrité du fichier téléchargé
   - Le fichier doit être signé numériquement par "Anecoop"

> 📸 **Capture d'écran simulée** : Fenêtre de téléchargement du navigateur montrant "RDS-Viewer-Anecoop-3.0.27-Setup.exe" avec une barre de progression à 100%.

### Étape 2 : Lancement de l'installeur

1. **Double-cliquez** sur le fichier `RDS-Viewer-Anecoop-3.0.27-Setup.exe`

2. **Autorisation Windows** (si demandée) :
   - Une fenêtre "Contrôle de compte d'utilisateur" apparaît
   - Cliquez sur **Oui** pour autoriser l'installation

> 📸 **Capture d'écran simulée** : Fenêtre UAC de Windows avec le message "Voulez-vous autoriser cette application à apporter des modifications à votre appareil ?" et les boutons "Oui" et "Non".

### Étape 3 : Assistant d'installation

1. **Écran de bienvenue**
   - Cliquez sur **Suivant** pour continuer

> 📸 **Capture d'écran simulée** : Fenêtre d'installation avec le logo RDS Viewer Anecoop, texte "Bienvenue dans l'assistant d'installation de RDS Viewer Anecoop v3.0.27" et boutons "Suivant" et "Annuler".

2. **Accord de licence**
   - Lisez les termes de la licence
   - Cochez **J'accepte les termes du contrat de licence**
   - Cliquez sur **Suivant**

> 📸 **Capture d'écran simulée** : Fenêtre montrant le contrat de licence dans une zone de texte avec ascenseur, case à cocher "J'accepte..." et boutons de navigation.

3. **Choix du répertoire d'installation**
   - Répertoire par défaut : `C:\Program Files\RDS Viewer Anecoop`
   - Pour modifier : cliquez sur **Parcourir** et sélectionnez un autre emplacement
   - Cliquez sur **Suivant**

> 📸 **Capture d'écran simulée** : Fenêtre avec champ de texte montrant "C:\Program Files\RDS Viewer Anecoop", bouton "Parcourir", et indication de l'espace requis vs disponible.

4. **Options d'installation**
   - ☑️ **Créer un raccourci sur le Bureau**
   - ☑️ **Créer un raccourci dans le Menu Démarrer**
   - ☑️ **Lancer RDS Viewer Anecoop au démarrage** (optionnel)
   - Cliquez sur **Suivant**

5. **Confirmation et installation**
   - Vérifiez les paramètres affichés
   - Cliquez sur **Installer**

> 📸 **Capture d'écran simulée** : Fenêtre de progression montrant "Installation en cours..." avec une barre de progression à 45%, détails "Installation de: modules principaux", temps estimé restant.

### Étape 4 : Finalisation

1. **Installation terminée**
   - Une fenêtre confirme la réussite de l'installation
   - Options :
     - ☑️ **Lancer RDS Viewer Anecoop maintenant**
   - Cliquez sur **Terminer**

> 📸 **Capture d'écran simulée** : Fenêtre finale avec message "RDS Viewer Anecoop v3.0.27 a été installé avec succès", case à cocher "Lancer RDS Viewer Anecoop" et bouton "Terminer".

**✅ Installation terminée !** L'application est maintenant prête à être configurée.

---

## 3. Installation personnalisée

### Accès aux options avancées

Lors de l'installation, après l'écran du répertoire d'installation, cliquez sur **Options avancées** pour accéder aux paramètres personnalisés.

### Options disponibles

#### 3.1 Choix des composants

Sélectionnez les composants à installer :

- ☑️ **Application principale** (obligatoire - 120 MB)
- ☑️ **Module OCR avancé** (optionnel - 30 MB)
  - Reconnaissance optique de caractères pour documents scannés
- ☑️ **Agent IA intégré** (optionnel - 50 MB)
  - Assistance intelligente et suggestions automatiques
- ☑️ **Fichiers d'aide et documentation** (optionnel - 15 MB)

> 📸 **Capture d'écran simulée** : Liste de cases à cocher avec taille de chaque composant et description, total d'espace requis affiché en bas.

#### 3.2 Configuration réseau

- **Port du serveur backend** : 3002 (par défaut)
- **Port de l'interface web** : 3000 (par défaut)
- **Autoriser l'accès distant** : ☐ Non recommandé pour les utilisateurs standard

#### 3.3 Configuration de la base de données

- **Type de base de données** : SQLite (local) - recommandé
- **Emplacement de la base de données** :
  - Par défaut : `%APPDATA%\RDS-Viewer-Anecoop\database`
  - Personnalisé : choisir un emplacement

#### 3.4 Paramètres de sécurité

- ☑️ **Activer le chiffrement de la base de données**
- ☑️ **Sauvegardes automatiques quotidiennes**
- ☐ **Mode audit avancé** (pour les administrateurs)

### Finalisation de l'installation personnalisée

Une fois vos choix effectués, cliquez sur **Suivant** puis **Installer** pour lancer l'installation avec vos paramètres personnalisés.

---

## 4. Installation silencieuse (déploiement entreprise)

### Présentation

L'installation silencieuse permet de déployer RDS Viewer Anecoop sur plusieurs postes sans interaction utilisateur. Idéal pour les administrateurs réseau et déploiements via GPO (Group Policy Object).

### Commande de base

Ouvrez une **invite de commandes en tant qu'administrateur** et exécutez :

```cmd
RDS-Viewer-Anecoop-3.0.27-Setup.exe /S
```

**Paramètres** :
- `/S` : Installation silencieuse (mode silent)

### Options avancées

#### Installation silencieuse avec emplacement personnalisé

```cmd
RDS-Viewer-Anecoop-3.0.27-Setup.exe /S /D=C:\MonDossier\RDSViewer
```

**Paramètres** :
- `/D=CHEMIN` : Spécifie le répertoire d'installation (doit être le dernier paramètre)

#### Installation silencieuse complète

```cmd
RDS-Viewer-Anecoop-3.0.27-Setup.exe /S /NODESKTOPSHORTCUT /NOSTARTMENUSHORTCUT /D=C:\RDSViewer
```

**Paramètres supplémentaires** :
- `/NODESKTOPSHORTCUT` : Ne pas créer de raccourci bureau
- `/NOSTARTMENUSHORTCUT` : Ne pas créer de raccourci menu démarrer
- `/NOAUTOSTART` : Ne pas démarrer au lancement de Windows
- `/COMPONENTS="main,ocr,ai"` : Choisir les composants à installer

#### Exemple complet pour déploiement entreprise

```cmd
RDS-Viewer-Anecoop-3.0.27-Setup.exe /S ^
  /NODESKTOPSHORTCUT ^
  /COMPONENTS="main,ocr" ^
  /ALLUSERS ^
  /D=C:\Program Files\RDS Viewer Anecoop
```

**Paramètres** :
- `/ALLUSERS` : Installation pour tous les utilisateurs de la machine
- `^` : Continuation de ligne en CMD Windows

### Vérification de l'installation silencieuse

L'installeur crée un fichier de log :

```
C:\Users\%USERNAME%\AppData\Local\Temp\RDS-Viewer-Setup-Log.txt
```

Pour vérifier le succès de l'installation :

```cmd
type "%LOCALAPPDATA%\Temp\RDS-Viewer-Setup-Log.txt"
```

Recherchez la ligne : `Installation completed successfully`

### Script de déploiement pour Active Directory

Créez un fichier `deploy-rds-viewer.bat` :

```batch
@echo off
REM Script de déploiement RDS Viewer Anecoop v3.0.27
REM Pour déploiement via GPO

echo Déploiement RDS Viewer Anecoop v3.0.27...

REM Installation silencieuse
\\serveur\partage\RDS-Viewer-Anecoop-3.0.27-Setup.exe /S /ALLUSERS /D=C:\Program Files\RDS Viewer Anecoop

REM Vérification
if exist "C:\Program Files\RDS Viewer Anecoop\RDS-Viewer-Anecoop.exe" (
    echo Installation réussie
    exit /b 0
) else (
    echo Installation échouée
    exit /b 1
)
```

### Désinstallation silencieuse

```cmd
"C:\Program Files\RDS Viewer Anecoop\uninstall.exe" /S
```

---

## 5. Installation portable (sans installeur)

### Présentation

La version portable ne nécessite **aucune installation** et peut être exécutée depuis une clé USB ou un dossier réseau.

### Étapes d'installation

#### Étape 1 : Téléchargement de la version portable

1. Téléchargez le fichier : `RDS-Viewer-Anecoop-3.0.27-Portable.zip`
2. Taille : ~200 MB (décompressé : ~450 MB)

#### Étape 2 : Extraction

1. **Faites un clic droit** sur le fichier ZIP
2. Sélectionnez **Extraire tout...**
3. Choisissez un emplacement :
   - Sur votre PC : `C:\RDS-Viewer-Portable`
   - Sur une clé USB : `E:\RDS-Viewer-Portable`
   - Sur un réseau : `\\serveur\apps\RDS-Viewer-Portable`
4. Cliquez sur **Extraire**

> 📸 **Capture d'écran simulée** : Fenêtre Windows d'extraction montrant la barre de progression "Extraction des fichiers..." avec liste de fichiers défilants.

#### Étape 3 : Structure du dossier portable

Après extraction, vous devriez avoir :

```
RDS-Viewer-Portable/
├── RDS-Viewer-Anecoop.exe          (Application principale)
├── resources/                       (Ressources de l'application)
├── data/                           (Données et configuration)
│   ├── config.json                (Configuration)
│   └── database/                  (Base de données locale)
├── portable.txt                    (Marqueur mode portable)
└── README.txt                      (Instructions)
```

### Utilisation de la version portable

1. **Double-cliquez** sur `RDS-Viewer-Anecoop.exe`
2. L'application démarre directement sans installation
3. Toutes les données sont stockées dans le dossier `data/`

### Avantages de la version portable

✅ **Aucune installation requise** - pas besoin de droits administrateur  
✅ **Totalement autonome** - fonctionne depuis n'importe où  
✅ **Données portables** - tous les paramètres dans un seul dossier  
✅ **Multi-postes** - utilisez la même application sur plusieurs PC  
✅ **Pas de traces** - rien n'est écrit dans le registre Windows  

### Configuration de la version portable

#### Première utilisation

Au premier lancement, l'application crée automatiquement :
- Le fichier de configuration : `data/config.json`
- La base de données : `data/database/rds-viewer.db`
- Les journaux : `data/logs/`

#### Personnalisation du chemin de données

Éditez le fichier `portable.txt` avec un éditeur de texte :

```
DATA_DIR=E:\MesDonnees\RDSViewer
```

Cela permet de séparer l'application (sur clé USB) des données (sur PC).

### Mise à jour de la version portable

1. Téléchargez la nouvelle version portable
2. Extrayez dans un nouveau dossier
3. **Copiez** votre dossier `data/` vers la nouvelle version
4. Supprimez l'ancienne version

> ⚠️ **Important** : Ne supprimez jamais le dossier `data/` qui contient vos données !

---

## 6. Première configuration

### Lancement initial de l'application

Au premier démarrage, un **Assistant de configuration** vous guide à travers les étapes essentielles.

> 📸 **Capture d'écran simulée** : Écran d'accueil avec logo RDS Viewer Anecoop, message "Bienvenue ! Configuration initiale requise" et bouton "Commencer".

### Étape 1 : Sélection de la langue

1. Choisissez votre langue préférée :
   - Español (par défaut)
   - English
   - Français
2. Cliquez sur **Suivant**

### Étape 2 : Création du compte administrateur

#### Informations requises

Remplissez le formulaire de création du compte administrateur :

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Nom complet** | Votre nom complet | Juan García Pérez |
| **Nom d'utilisateur** | Identifiant de connexion | admin ou jgarcia |
| **Adresse e-mail** | E-mail professionnel | juan.garcia@anecoop.com |
| **Mot de passe** | Mot de passe sécurisé | ********** |
| **Confirmer mot de passe** | Répétez le mot de passe | ********** |

> 📸 **Capture d'écran simulée** : Formulaire de création de compte avec les champs ci-dessus, indicateur de force du mot de passe (barre verte "Fort"), et boutons "Précédent" / "Suivant".

#### Critères du mot de passe

Le mot de passe doit contenir :
- ✅ Au moins 8 caractères
- ✅ Au moins 1 lettre majuscule
- ✅ Au moins 1 lettre minuscule
- ✅ Au moins 1 chiffre
- ✅ Au moins 1 caractère spécial (@, #, $, %, etc.)

> 💡 **Conseil** : Notez vos identifiants dans un endroit sécurisé !

### Étape 3 : Configuration de la base de données

#### Mode de base de données

Deux options sont disponibles :

**Option 1 : Base de données locale SQLite** (recommandée pour démarrage)

- ✅ **Simple et automatique**
- ✅ **Aucune configuration requise**
- ✅ **Parfait pour utilisateur unique ou petit groupe**
- Emplacement : `C:\Users\%USERNAME%\AppData\Roaming\RDS-Viewer-Anecoop\database\`

> 📸 **Capture d'écran simulée** : Deux grandes cartes, l'une avec icône de base de données locale (sélectionnée avec bordure bleue), l'autre avec icône serveur réseau.

**Option 2 : Serveur de base de données distant** (pour entreprise)

Si vous disposez d'un serveur de base de données centralisé :

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| **Type** | Type de serveur | PostgreSQL / MySQL / SQL Server |
| **Hôte** | Adresse du serveur | db.anecoop.local ou 192.168.1.50 |
| **Port** | Port de connexion | 5432 (PostgreSQL) / 3306 (MySQL) |
| **Base de données** | Nom de la base | rds_viewer_anecoop |
| **Utilisateur** | Nom d'utilisateur DB | rds_user |
| **Mot de passe** | Mot de passe DB | ********** |

Cliquez sur **Tester la connexion** pour vérifier.

> 💡 **Pour la plupart des utilisateurs** : choisissez l'option 1 (SQLite local).

### Étape 4 : Configuration réseau (optionnel)

#### Paramètres par défaut (recommandés)

- **Port backend** : 3002
- **Port interface web** : 3000
- **Accès réseau** : Localhost uniquement (sécurisé)

#### Si vous devez modifier les ports

Cela peut être nécessaire si ces ports sont déjà utilisés par une autre application :

1. Cliquez sur **Paramètres avancés**
2. Modifiez les numéros de port
3. Cliquez sur **Vérifier la disponibilité**

> ⚠️ **Attention** : Changez ces paramètres seulement si nécessaire.

### Étape 5 : Options de sauvegarde automatique

Configuration des sauvegardes automatiques de la base de données :

- ☑️ **Activer les sauvegardes automatiques** (recommandé)
- **Fréquence** : Quotidienne (par défaut) / Hebdomadaire / Mensuelle
- **Heure de sauvegarde** : 02:00 (par défaut)
- **Nombre de sauvegardes à conserver** : 7 (par défaut)
- **Emplacement** : `C:\Users\%USERNAME%\Documents\RDS-Viewer-Backups`

> 💡 **Recommandation** : Conservez les paramètres par défaut pour une protection optimale.

### Étape 6 : Finalisation de la configuration

1. **Résumé de la configuration**
   - Vérifiez tous les paramètres affichés
   - Possibilité de revenir en arrière pour modifier

2. Cliquez sur **Terminer la configuration**

3. L'application initialise :
   - Création de la base de données
   - Création du compte administrateur
   - Chargement des paramètres

> 📸 **Capture d'écran simulée** : Barre de progression "Initialisation de l'application..." avec étapes détaillées (Création base de données ✓, Création compte admin ✓, Chargement modules...).

4. **Configuration terminée !**
   - Message de confirmation
   - Cliquez sur **Accéder à l'application**

---

## 7. Vérification de l'installation

### Checklist de vérification

Après l'installation et la configuration, vérifiez les points suivants :

#### ✅ 1. L'application démarre correctement

- Double-cliquez sur l'icône RDS Viewer Anecoop sur le bureau
- L'application doit s'ouvrir en moins de 10 secondes
- Aucun message d'erreur ne doit apparaître

#### ✅ 2. Connexion avec le compte administrateur

1. Sur l'écran de connexion, entrez :
   - **Nom d'utilisateur** : celui créé lors de la configuration
   - **Mot de passe** : celui créé lors de la configuration
2. Cliquez sur **Connexion**
3. Vous devez accéder au tableau de bord principal

> 📸 **Capture d'écran simulée** : Écran de connexion avec champs utilisateur/mot de passe, logo de l'application en haut, bouton "Connexion" bleu.

#### ✅ 3. Vérification des modules

Dans le menu **À propos** ou **Aide** :

- Vérifiez que la version affichée est : **v3.0.27**
- Vérifiez les modules installés :
  - ✅ Module principal
  - ✅ Module OCR (si installé)
  - ✅ Agent IA (si installé)

> 📸 **Capture d'écran simulée** : Fenêtre "À propos" montrant le logo, "RDS Viewer Anecoop v3.0.27", liste des modules avec statuts "Actif", informations de licence.

#### ✅ 4. Base de données fonctionnelle

Test simple :

1. Allez dans **Configuration** > **Utilisateurs**
2. Vous devez voir votre compte administrateur dans la liste
3. Essayez de créer un utilisateur de test :
   - Nom : Test Utilisateur
   - Username : testuser
   - Rôle : Utilisateur standard
4. Cliquez sur **Enregistrer**
5. Le nouvel utilisateur doit apparaître dans la liste

Si cette opération réussit ➜ **La base de données fonctionne correctement** ✅

#### ✅ 5. Fichiers et dossiers créés

Vérifiez que les dossiers suivants existent :

**Pour installation standard** :
```
C:\Program Files\RDS Viewer Anecoop\
C:\Users\%USERNAME%\AppData\Roaming\RDS-Viewer-Anecoop\
C:\Users\%USERNAME%\AppData\Roaming\RDS-Viewer-Anecoop\database\
C:\Users\%USERNAME%\AppData\Roaming\RDS-Viewer-Anecoop\logs\
```

**Pour version portable** :
```
[Dossier_Installation]\RDS-Viewer-Portable\data\
[Dossier_Installation]\RDS-Viewer-Portable\data\database\
[Dossier_Installation]\RDS-Viewer-Portable\data\logs\
```

#### ✅ 6. Vérification des journaux (logs)

1. Ouvrez le dossier des logs (voir chemins ci-dessus)
2. Vous devez trouver des fichiers comme :
   - `application-2025-11-04.log`
   - `server-2025-11-04.log`
3. Ouvrez le fichier le plus récent avec le Bloc-notes
4. Vérifiez qu'il n'y a pas d'erreurs (lignes commençant par `[ERROR]`)

**Exemple de log sain** :
```
[2025-11-04 14:53:04] [INFO] Application started successfully
[2025-11-04 14:53:05] [INFO] Database connection established
[2025-11-04 14:53:06] [INFO] Backend server started on port 3002
[2025-11-04 14:53:07] [INFO] User 'admin' logged in successfully
```

### Tests fonctionnels de base

#### Test 1 : Navigation dans l'interface

- Parcourez les différents menus : Tableau de bord, Documents, Utilisateurs, Configuration
- Toutes les pages doivent se charger sans erreur

#### Test 2 : Upload d'un document test (si applicable)

1. Allez dans **Documents** > **Nouveau document**
2. Cliquez sur **Parcourir** et sélectionnez un fichier de test
3. Cliquez sur **Télécharger**
4. Le document doit apparaître dans la liste

#### Test 3 : Vérification OCR (si module installé)

1. Uploadez une image contenant du texte
2. Le système doit automatiquement extraire le texte
3. Vérifiez que le texte extrait est lisible

### En cas de problème

Si l'un des points de vérification échoue, consultez la section [Dépannage](#9-dépannage).

---

## 8. Démarrage de l'application

### Méthode 1 : Raccourci bureau (recommandée)

1. **Double-cliquez** sur l'icône **RDS Viewer Anecoop** sur votre bureau
2. L'application s'ouvre automatiquement

> 📸 **Capture d'écran simulée** : Bureau Windows avec icône RDS Viewer Anecoop (logo bleu/vert avec texte), parmi d'autres icônes.

### Méthode 2 : Menu Démarrer

1. Cliquez sur le bouton **Démarrer** Windows
2. Tapez : `RDS Viewer`
3. Cliquez sur **RDS Viewer Anecoop** dans les résultats

> 📸 **Capture d'écran simulée** : Menu Démarrer Windows avec barre de recherche montrant "RDS Viewer", résultat de recherche surligné.

### Méthode 3 : Dossier d'installation

**Pour installation standard** :
1. Ouvrez l'Explorateur de fichiers
2. Naviguez vers : `C:\Program Files\RDS Viewer Anecoop`
3. Double-cliquez sur `RDS-Viewer-Anecoop.exe`

**Pour version portable** :
1. Ouvrez l'Explorateur de fichiers
2. Naviguez vers votre dossier portable
3. Double-cliquez sur `RDS-Viewer-Anecoop.exe`

### Méthode 4 : Démarrage automatique

Si vous avez activé le démarrage automatique lors de l'installation :

- L'application démarre **automatiquement** au démarrage de Windows
- Une icône apparaît dans la zone de notification (à côté de l'horloge)
- Cliquez sur l'icône pour ouvrir la fenêtre principale

### Première connexion

#### Écran de connexion

Au démarrage, l'écran de connexion s'affiche :

| Champ | Description |
|-------|-------------|
| **Nom d'utilisateur** | Entrez votre identifiant |
| **Mot de passe** | Entrez votre mot de passe |
| ☐ **Rester connecté** | Maintenir la session active |

Options disponibles :
- **Connexion** : Se connecter à l'application
- **Mot de passe oublié ?** : Réinitialiser le mot de passe
- **Aide** : Accéder à la documentation

> 📸 **Capture d'écran simulée** : Fenêtre de connexion avec fond en dégradé bleu, logo centré, deux champs de saisie, case à cocher, et bouton bleu "Connexion".

#### Après connexion réussie

Vous accédez au **Tableau de bord principal** :

- **Menu latéral gauche** : Navigation principale
  - 📊 Tableau de bord
  - 📄 Documents
  - 👥 Utilisateurs
  - 📁 Gestion de contenu
  - ⚙️ Configuration
  - ❓ Aide

- **Zone centrale** : Contenu principal et widgets
  - Statistiques du jour
  - Documents récents
  - Activités récentes
  - Raccourcis rapides

- **En-tête** : Barre supérieure
  - Notifications
  - Profil utilisateur
  - Déconnexion

> 📸 **Capture d'écran simulée** : Interface principale avec menu latéral bleu foncé, zone centrale blanche avec cartes de statistiques colorées, en-tête avec icônes de notifications et avatar utilisateur.

### Fermeture de l'application

#### Fermeture normale

1. Cliquez sur le bouton **X** en haut à droite de la fenêtre, ou
2. Menu **Fichier** > **Quitter**, ou
3. Clic droit sur l'icône de la barre des tâches > **Quitter**

#### Fermeture avec minimisation dans la zone de notification

Si configuré :
- Cliquer sur **X** minimise l'application dans la barre d'état système
- Pour fermer complètement : clic droit sur l'icône > **Quitter**

### Déconnexion sans fermer l'application

1. Cliquez sur votre **nom d'utilisateur** en haut à droite
2. Sélectionnez **Déconnexion**
3. Vous revenez à l'écran de connexion
4. Un autre utilisateur peut se connecter

---

## 9. Dépannage

### Problème 1 : L'installeur ne démarre pas

**Symptômes** :
- Double-clic sur l'installeur sans effet
- Message "Le fichier est corrompu"

**Solutions** :

1. **Vérifiez que vous avez téléchargé le fichier complet**
   - Taille attendue : ~150 MB
   - Re-téléchargez si nécessaire

2. **Désactivez temporairement l'antivirus**
   - Certains antivirus bloquent les installeurs
   - Ajoutez une exception pour le fichier

3. **Exécutez en tant qu'administrateur**
   - Clic droit sur l'installeur
   - **Exécuter en tant qu'administrateur**

4. **Vérifiez la signature numérique**
   - Clic droit > Propriétés > Signatures numériques
   - Doit être signé par "Anecoop"

### Problème 2 : Erreur "Port déjà utilisé" au démarrage

**Symptômes** :
- Message : "Le port 3002 est déjà utilisé"
- L'application ne démarre pas

**Solutions** :

1. **Vérifiez qu'une autre instance n'est pas déjà lancée**
   - Ctrl + Maj + Échap (Gestionnaire des tâches)
   - Recherchez "RDS-Viewer-Anecoop.exe"
   - Terminez le processus si présent

2. **Identifiez l'application qui utilise le port**
   ```cmd
   netstat -ano | findstr :3002
   ```

3. **Modifiez le port dans la configuration**
   - Éditez : `%APPDATA%\RDS-Viewer-Anecoop\config.json`
   - Changez `"serverPort": 3002` en `"serverPort": 3003`
   - Sauvegardez et relancez l'application

### Problème 3 : Impossible de se connecter (compte administrateur)

**Symptômes** :
- Message "Nom d'utilisateur ou mot de passe incorrect"
- Vous êtes sûr des identifiants

**Solutions** :

1. **Vérifiez les majuscules/minuscules**
   - Les identifiants sont sensibles à la casse
   - Vérifiez que la touche Caps Lock n'est pas activée

2. **Réinitialisez le mot de passe administrateur**
   - Cliquez sur **Mot de passe oublié ?**
   - Suivez les instructions de réinitialisation

3. **Réinitialisation manuelle (version portable uniquement)**
   - Fermez l'application
   - Supprimez le fichier : `data/database/rds-viewer.db`
   - Relancez l'application (base de données recréée)
   - ⚠️ **Attention** : Toutes les données seront perdues !

### Problème 4 : L'application est lente ou ne répond pas

**Symptômes** :
- Interface qui rame
- Temps de chargement très long
- Application qui freeze

**Solutions** :

1. **Vérifiez les ressources système**
   - Gestionnaire des tâches > Performance
   - RAM utilisée > 90% ? Fermez d'autres applications
   - Disque à 100% ? Problème de stockage

2. **Nettoyez la base de données**
   - Menu **Maintenance** > **Optimiser la base de données**
   - Supprime les données temporaires

3. **Videz le cache de l'application**
   - Menu **Configuration** > **Avancé** > **Vider le cache**

4. **Vérifiez les journaux d'erreurs**
   - `%APPDATA%\RDS-Viewer-Anecoop\logs`
   - Recherchez les lignes `[ERROR]`

### Problème 5 : Module OCR ne fonctionne pas

**Symptômes** :
- Pas d'extraction de texte depuis les images
- Message "Module OCR non disponible"

**Solutions** :

1. **Vérifiez que le module est installé**
   - Menu **Aide** > **À propos**
   - Module OCR doit être listé comme "Actif"

2. **Réinstallez le module OCR**
   - Réexécutez l'installeur
   - Choisissez "Modifier" l'installation
   - Cochez "Module OCR avancé"

3. **Version portable : Téléchargez le module séparément**
   - Téléchargez `ocr-module-3.0.27.zip`
   - Extrayez dans `[Dossier]\resources\ocr\`

### Problème 6 : Échec de la sauvegarde automatique

**Symptômes** :
- Notification "Échec de la sauvegarde automatique"
- Pas de fichiers de sauvegarde créés

**Solutions** :

1. **Vérifiez l'espace disque disponible**
   - Besoin d'au moins 500 MB libres
   - Nettoyez le disque si nécessaire

2. **Vérifiez les permissions du dossier de sauvegarde**
   - Par défaut : `C:\Users\%USERNAME%\Documents\RDS-Viewer-Backups`
   - Assurez-vous d'avoir les droits en écriture

3. **Changez l'emplacement de sauvegarde**
   - Menu **Configuration** > **Sauvegardes**
   - Choisissez un autre emplacement

4. **Déclenchez une sauvegarde manuelle**
   - Menu **Maintenance** > **Créer une sauvegarde maintenant**
   - Vérifiez si des erreurs apparaissent

### Problème 7 : Erreur de base de données corrompue

**Symptômes** :
- Message "Database error" ou "Database is locked"
- Impossible de sauvegarder des données

**Solutions** :

1. **Restaurez une sauvegarde récente**
   - Menu **Maintenance** > **Restaurer une sauvegarde**
   - Sélectionnez la sauvegarde la plus récente
   - Suivez l'assistant de restauration

2. **Réparez la base de données**
   - Menu **Maintenance** > **Réparer la base de données**
   - Fermez l'application pendant la réparation

3. **En dernier recours : reconstruction complète**
   - Sauvegardez manuellement vos données importantes
   - Supprimez la base de données
   - Relancez l'application (nouvelle base créée)

### Problème 8 : Certificat SSL/TLS invalide (connexion base distante)

**Symptômes** :
- Erreur de connexion au serveur distant
- Message "Certificate verification failed"

**Solutions** :

1. **Vérifiez la date/heure du système**
   - Paramètres Windows > Heure et langue
   - Synchronisez l'heure automatiquement

2. **Contactez votre administrateur réseau**
   - Certificat du serveur peut être expiré
   - Pare-feu peut bloquer la connexion

### Obtenir de l'aide supplémentaire

Si aucune de ces solutions ne résout votre problème :

1. **Consultez la documentation en ligne**
   - Menu **Aide** > **Documentation en ligne**

2. **Contactez le support technique**
   - E-mail : support-rdsviewer@anecoop.com
   - Téléphone : +34 XXX XXX XXX
   - Horaires : Lun-Ven, 9h-18h (heure locale)

3. **Préparez les informations suivantes avant de contacter le support** :
   - Version de RDS Viewer Anecoop : v3.0.27
   - Système d'exploitation : Windows XX (32/64 bits)
   - Description détaillée du problème
   - Message d'erreur exact (capture d'écran si possible)
   - Fichier de log : `%APPDATA%\RDS-Viewer-Anecoop\logs\application-[date].log`

---

## 📌 Annexes

### Annexe A : Commandes utiles

#### Vérifier si l'application est en cours d'exécution

```cmd
tasklist | findstr "RDS-Viewer"
```

#### Forcer l'arrêt de l'application

```cmd
taskkill /F /IM RDS-Viewer-Anecoop.exe
```

#### Localiser le dossier de configuration

```cmd
explorer %APPDATA%\RDS-Viewer-Anecoop
```

#### Localiser le dossier d'installation

```cmd
explorer "C:\Program Files\RDS Viewer Anecoop"
```

### Annexe B : Fichiers de configuration importants

| Fichier | Emplacement | Description |
|---------|-------------|-------------|
| `config.json` | `%APPDATA%\RDS-Viewer-Anecoop\` | Configuration principale |
| `rds-viewer.db` | `%APPDATA%\RDS-Viewer-Anecoop\database\` | Base de données SQLite |
| `application.log` | `%APPDATA%\RDS-Viewer-Anecoop\logs\` | Journal applicatif |
| `server.log` | `%APPDATA%\RDS-Viewer-Anecoop\logs\` | Journal serveur backend |

### Annexe C : Ports utilisés par l'application

| Port | Service | Protocole | Modifiable |
|------|---------|-----------|------------|
| 3002 | Backend API | HTTP | ✅ Oui |
| 3000 | Interface Web | HTTP | ✅ Oui |

### Annexe D : Configuration réseau pour pare-feu d'entreprise

Si votre entreprise utilise un pare-feu strict, autorisez :

**Règles entrantes** :
- Port : 3002, Protocole : TCP, Application : RDS-Viewer-Anecoop.exe
- Port : 3000, Protocole : TCP, Application : RDS-Viewer-Anecoop.exe

**Règles sortantes** (si connexion base distante) :
- Port : 5432 (PostgreSQL) / 3306 (MySQL), Protocole : TCP

---

## 🎉 Félicitations !

Vous avez terminé l'installation et la configuration de **RDS Viewer Anecoop v3.0.27**.

L'application est maintenant prête à être utilisée. Pour apprendre à utiliser les fonctionnalités principales, consultez le **Guide de l'utilisateur** disponible dans le menu **Aide** de l'application.

---

## 📝 Informations sur le document

- **Titre** : Guide d'Installation Complet - RDS Viewer Anecoop
- **Version de l'application** : v3.0.27
- **Version du document** : 1.0
- **Date de création** : 4 novembre 2025
- **Auteur** : Équipe RDS Viewer Anecoop
- **Public cible** : Utilisateurs finaux, administrateurs système

---

**© 2025 Anecoop - Tous droits réservés**
