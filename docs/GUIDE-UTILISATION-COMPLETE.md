# Guide d'Utilisation Complète - RDS Viewer Anecoop v3.0.27

## 📋 Table des Matières

1. [Première Connexion](#première-connexion)
2. [Tableau de Bord et Statistiques](#tableau-de-bord-et-statistiques)
3. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
4. [Gestion des Prêts de Matériel](#gestion-des-prêts-de-matériel)
5. [Monitoring des Serveurs et Sessions RDS](#monitoring-des-serveurs-et-sessions-rds)
6. [Gestion de l'Inventaire](#gestion-de-linventaire)
7. [Chat DocuCortex IA](#chat-docucortex-ia)
8. [Agent IA et Reconnaissance OCR](#agent-ia-et-reconnaissance-ocr)
9. [Gestion GED (Gestion Électronique des Documents)](#gestion-ged)
10. [Système de Permissions et Accès](#système-de-permissions-et-accès)

---

## 🔐 Première Connexion

### Démarrage de l'Application
1. **Lancer RDS Viewer Anecoop** depuis le raccourci bureau ou menu démarrer
2. **Écran de connexion** apparaît avec options d'authentification

### Méthodes d'Authentification

#### Option 1 : Authentification Active Directory (Recommandée)
- Sélectionner "Connexion Active Directory"
- Saisir vos identifiants Windows habituels
- L'application détecte automatiquement vos permissions

#### Option 2 : Authentification Locale
- Sélectionner "Connexion Locale"
- Utiliser les identifiants fournis par l'administrateur
- Première connexion : mot de passe temporaire à changer

### Rôles et Permissions
Votre interface s'adapte automatiquement selon votre rôle :

| Rôle | Icône | Accès Principal |
|------|-------|-----------------|
| **Super Admin** | 👑 | Accès total, configuration système |
| **Admin** | 👨‍💼 | Gestion utilisateurs, configuration |
| **Spécialiste GED** | 📚 | Gestion documents, OCR, IA |
| **Manager** | 👔 | Supervision, rapports, validation |
| **Technicien** | 🔧 | Maintenance, inventaire, sessions |
| **Observateur** | 👁️ | Consultation uniquement |

---

## 📊 Tableau de Bord et Statistiques

### Vue d'Ensemble
Le tableau de bord central affiche en temps réel :

#### Widgets Principaux
- **🔢 Sessions RDS Actives** : Nombre d'utilisateurs connectés
- **📈 Performance Serveurs** : CPU, RAM, stockage
- **📦 Matériel en Prêt** : Statut des équipements
- **📋 Tickets Support** : Demandes en attente
- **🤖 Activité IA** : Requêtes traitées par DocuCortex

#### Graphiques Analytics
- **Graphique d'utilisation** : Pics d'activité par heure/jour
- **Heatmap sessions** : Répartition géographique
- **Tendances mensuelles** : Évolution des KPIs

### Personnalisation
- **Déplacer widgets** : Glisser-déposer
- **Redimensionner** : Coins de redimensionnement
- **Filtres temporels** : Dernière heure, jour, semaine, mois
- **Actualisation auto** : 30s, 1min, 5min, manuelle

---

## 👥 Gestion des Utilisateurs

### Ajouter un Utilisateur

#### Méthode 1 : Import Active Directory
1. Cliquer sur **"Synchroniser AD"**
2. Sélectionner l'OU (Unité Organisationnelle)
3. Choisir les utilisateurs à importer
4. Attribuer les rôles automatiquement selon les groupes AD

#### Méthode 2 : Création Manuelle
1. **Nouveau Utilisateur** → Bouton ➕
2. **Informations requises** :
   - Nom complet
   - Email professionnel
   - Département/Service
   - Rôle dans l'application
   - Date d'expiration (optionnel)

### Gestion des Profils

#### Modification Utilisateur
- **Données personnelles** : Nom, email, téléphone
- **Rôles et permissions** : Changement de niveau d'accès
- **Préférences** : Langue, notifications, thème
- **Historique activité** : Connexions, actions effectuées

#### États Utilisateur
- **🟢 Actif** : Utilisateur opérationnel
- **🟡 Suspendu** : Accès temporairement bloqué
- **🔴 Désactivé** : Compte fermé (données conservées)
- **⚫ Supprimé** : Suppression définitive (irréversible)

### Groupes et Équipes
- **Créer groupes** : Par département, projet, localisation
- **Permissions groupées** : Héritage des droits
- **Délégation administration** : Gestionnaires de groupe

---

## 📦 Gestion des Prêts de Matériel

### Catalogue Matériel

#### Types d'Équipements
- **💻 Ordinateurs portables** : Dell, HP, Lenovo
- **📱 Téléphones/Tablettes** : iOS, Android
- **🖥️ Écrans externes** : Toutes tailles
- **⌨️ Périphériques** : Souris, claviers, webcams
- **🔌 Accessoires** : Chargeurs, adaptateurs, docks

#### États du Matériel
- **✅ Disponible** : Prêt à être assigné
- **🔄 En prêt** : Utilisé par un employé
- **🔧 Maintenance** : Réparation en cours
- **❌ Hors service** : Non réparable

### Processus de Prêt

#### Créer un Nouveau Prêt
1. **Sélectionner utilisateur** : Recherche par nom/email
2. **Choisir matériel** : Filtrer par type, disponibilité
3. **Définir durée** : Date début/fin, renouvellement auto
4. **Conditions spéciales** : Assurance, formation requise
5. **Validation** : Approbation manager si nécessaire

#### Suivi des Prêts
- **📅 Calendrier** : Vue planning de tous les prêts
- **🔔 Alertes** : Retours en retard, fin de prêt proche
- **📊 Statistiques** : Taux d'utilisation par équipement
- **💰 Valorisation** : Coût des équipements en circulation

### Retours et Maintenance
- **Check-list retour** : Vérification état, accessoires
- **Maintenance préventive** : Nettoyage, mises à jour
- **Réparations** : Suivi prestataires, devis, délais

---

## 🖥️ Monitoring des Serveurs et Sessions RDS

### Vue d'Ensemble Infrastructure

#### Serveurs Surveillés
- **🏢 Serveurs de sessions** : RDS, Citrix, VMware Horizon
- **🗄️ Serveurs de données** : Fichiers, bases de données
- **🌐 Serveurs web** : Applications métier
- **🔐 Serveurs d'authentification** : Active Directory

#### Métriques Temps Réel
- **CPU Usage** : Pourcentage par cœur
- **RAM Usage** : Utilisée/Disponible + cache
- **Stockage** : Espace disque, IOPS
- **Réseau** : Bande passante in/out
- **Sessions** : Actives, déconnectées, en erreur

### Gestion des Sessions RDS

#### Sessions Utilisateurs
- **👤 Utilisateur connecté** : Nom, département
- **⏱️ Durée session** : Depuis connexion
- **💻 Application utilisée** : Programme actif
- **📊 Consommation ressources** : CPU/RAM par session
- **📡 Qualité réseau** : Latence, perte paquets

#### Actions sur Sessions
- **📨 Envoyer message** : Communication avec l'utilisateur
- **🔄 Déconnecter** : Fermeture propre de session
- **⚠️ Forcer fermeture** : Arrêt immédiat (urgence)
- **📋 Journaliser** : Ajouter note au suivi

### Alertes et Monitoring

#### Seuils Configurables
- **CPU** : Alerte si >80% pendant 5min
- **RAM** : Alerte si >85% pendant 2min
- **Stockage** : Alerte si <15% espace libre
- **Sessions** : Alerte si >limite définie

#### Historiques Performance
- **📈 Graphiques longue durée** : 7j, 30j, 1an
- **📊 Rapports automatiques** : Mensuel, trimestriel
- **🔍 Analyse tendances** : Prédiction besoins

---

## 📋 Gestion de l'Inventaire

### Catalogue Complet

#### Catégorisation
- **🏢 Par localisation** : Bâtiment, étage, bureau
- **📁 Par type** : Hardware, software, mobilier
- **💰 Par valeur** : Seuils de gestion
- **📅 Par ancienneté** : Date d'achat, amortissement

#### Informations Trackées
- **Identification** : N° série, code-barres, étiquette
- **Spécifications** : Modèle, configuration, version
- **Financier** : Prix d'achat, fournisseur, garantie
- **Lifecycle** : Installation, maintenance, fin de vie

### Processus d'Inventaire

#### Ajout d'Équipement
1. **Scan code-barres** : Reconnaissance automatique
2. **Fiche détaillée** : Saisie caractéristiques
3. **Affectation** : Localisation, responsable
4. **Photo** : Capture état initial
5. **Validation** : Approbation hiérarchique

#### Inventaire Physique
- **📱 Mode mobile** : Application smartphone
- **🔍 Vérification terrain** : Scan par zone
- **📊 Rapports écarts** : Manquants, surplus
- **✅ Reconciliation** : Validation finale

### Mouvements et Traçabilité
- **📦 Transferts** : Entre sites, services
- **🔄 Maintenances** : Préventive, curative
- **♻️ Fin de vie** : Recyclage, destruction
- **📈 Analytics** : ROI, taux de panne

---

## 🤖 Chat DocuCortex IA

### Interface de Chat Intelligent

#### Démarrage d'une Conversation
1. **Ouvrir le chat** : Icône 💬 en bas à droite
2. **Sélectionner contexte** : Général, technique, administratif
3. **Poser votre question** : Langage naturel français/espagnol
4. **Recevoir réponse** : IA analyse et répond

#### Types de Requêtes Supportées
- **🔍 Recherche documents** : "Trouve-moi les contrats 2024"
- **📊 Analytics** : "Quel est le taux d'utilisation serveurs?"
- **🛠️ Support technique** : "Pourquoi le serveur X est lent?"
- **📋 Procédures** : "Comment créer un nouvel utilisateur?"
- **🤖 IA générale** : Questions métier, assistance

### Fonctionnalités Avancées

#### Recherche Sémantique
- **Compréhension contexte** : L'IA comprend les intentions
- **Synonymes** : Recherche élargie automatique
- **Historique** : Référence aux conversations précédentes
- **Suggestions** : Propositions de questions liées

#### Intégration Modules
- **📊 Données temps réel** : Stats du tableau de bord
- **👥 Informations utilisateurs** : Statuts, permissions
- **📦 Inventaire** : Disponibilité matériel
- **🖥️ Monitoring** : État serveurs et sessions

### Modèles IA Disponibles

#### Ollama Local (Défaut)
- **Modèle** : llama3.2:3b
- **🔒 Confidentialité** : Traitement local, aucune fuite
- **⚡ Performance** : Réponse <3 secondes
- **🌐 Offline** : Fonctionne sans internet

#### Configuration Multi-Modèles
- **🎯 Spécialisation** : Modèles par domaine
- **⚖️ Load balancing** : Répartition intelligente
- **📈 Monitoring IA** : Métriques performance

---

## 🧠 Agent IA et Reconnaissance OCR

### Reconnaissance OCR Multi-Langues

#### Documents Supportés
- **📄 PDF** : Natifs et scannés
- **🖼️ Images** : JPG, PNG, TIFF, BMP
- **📸 Photos** : Captures smartphone/tablette
- **📋 Formulaires** : Structurés et libres

#### Langues Reconnues (11 langues)
- **🇫🇷 Français** : Précision >95%
- **🇪🇸 Espagnol** : Précision >95%
- **🇬🇧 Anglais** : Précision >98%
- **🇩🇪 Allemand** : Précision >92%
- **🇮🇹 Italien** : Précision >92%
- **🇵🇹 Portugais** : Précision >90%
- **🇳🇱 Néerlandais** : Précision >88%
- **🇷🇺 Russe** : Précision >85%
- **🇨🇳 Chinois** : Précision >88%
- **🇯🇵 Japonais** : Précision >85%
- **🇰🇷 Coréen** : Précision >83%

### Processus OCR

#### Traitement Automatique
1. **📤 Upload document** : Glisser-déposer ou sélection
2. **🔍 Détection langue** : Reconnaissance automatique
3. **⚙️ Préprocessing** : Amélioration qualité image
4. **🤖 Extraction texte** : OCR EasyOCR + post-traitement
5. **✅ Validation** : Vérification cohérence

#### Optimisations IA
- **📐 Redressement** : Correction inclinaison
- **🔆 Amélioration contraste** : Meilleure lisibilité
- **🧹 Débruitage** : Suppression artefacts
- **📊 Segmentation** : Zones texte vs images
- **🔤 Post-correction** : Dictionnaire contextuel

### Agent IA Intelligent

#### Analyse Documentaire
- **📑 Extraction entités** : Dates, montants, références
- **🏷️ Classification auto** : Type document, importance
- **🔗 Liens métier** : Relations avec autres docs
- **📊 Résumé automatique** : Points clés extraits

#### Workflow Automatisé
- **📋 Validation règles** : Conformité automatique
- **🚀 Routage intelligent** : Vers bon service
- **⏰ Rappels** : Échéances, actions requises
- **📈 Reporting** : Statistiques traitement

---

## 📚 Gestion GED (Gestion Électronique des Documents)

### Architecture Documentaire

#### Structure Hiérarchique
- **🏢 Organisation** : Par département/service
- **📁 Projets** : Dossiers temporaires
- **📅 Chronologique** : Par année/trimestre
- **🏷️ Thématique** : Contrats, factures, rapports
- **⭐ Favoris** : Accès rapide documents fréquents

#### Types de Documents
- **📄 Administratifs** : Contrats, conventions, délibérations
- **💰 Financiers** : Factures, devis, bons de commande
- **👥 RH** : Fiches de poste, formations, évaluations
- **🔧 Techniques** : Manuels, procédures, schémas
- **📊 Reporting** : Tableaux de bord, analyses

### Fonctionnalités Avancées

#### Recherche Intelligente
- **🔍 Texte intégral** : Dans le contenu OCR
- **🏷️ Métadonnées** : Auteur, date, mots-clés
- **🧠 Sémantique** : Compréhension du sens
- **🔗 Relations** : Documents liés
- **📊 Facettes** : Filtres dynamiques

#### Versioning et Collaboration
- **📝 Historique versions** : Suivi modifications
- **👥 Collaboration** : Commentaires, annotations
- **🔒 Verrouillage** : Édition exclusive
- **✅ Validation workflow** : Circuit approbation
- **📧 Notifications** : Alertes modifications

### Sécurité et Conformité

#### Contrôle d'Accès
- **🔐 Permissions granulaires** : Par document/dossier
- **👥 Groupes d'accès** : Héritage hiérarchique
- **⏰ Accès temporaire** : Droits limités dans le temps
- **🔍 Audit trail** : Traçabilité complète

#### Conformité Légale
- **📅 Durées conservation** : Selon réglementation
- **🗑️ Purge automatique** : Suppression programmée
- **🔐 Chiffrement** : At-rest et in-transit
- **📋 Certification** : ISO 27001, RGPD ready

---

## 🔐 Système de Permissions et Accès

### Matrice des Rôles

#### Super Admin 👑
**Accès total système**
- ✅ Configuration globale application
- ✅ Gestion utilisateurs tous niveaux
- ✅ Paramétrage sécurité avancée
- ✅ Accès logs et audit complet
- ✅ Maintenance serveurs
- ✅ Sauvegarde/restauration
- ✅ Personnalisation interface
- ✅ Intégrations externes (AD, API)

#### Admin 👨‍💼
**Administration opérationnelle**
- ✅ Gestion utilisateurs (sauf Super Admin)
- ✅ Configuration modules métier
- ✅ Rapports et analytics avancés
- ✅ Gestion prêts matériel
- ✅ Supervision sessions RDS
- ❌ Configuration sécurité système
- ❌ Accès serveurs physiques
- ✅ Délégation permissions

#### Spécialiste GED 📚
**Expert documentaire et IA**
- ✅ Gestion complète GED
- ✅ Configuration OCR/IA
- ✅ Training modèles IA
- ✅ Workflows documentaires
- ✅ Migration données
- ❌ Gestion utilisateurs
- ❌ Configuration infrastructure
- ✅ Formation utilisateurs OCR

#### Manager 👔
**Supervision équipes**
- ✅ Tableau de bord équipe
- ✅ Validation demandes matériel
- ✅ Rapports performance équipe
- ✅ Gestion planning ressources
- ✅ Accès documents équipe
- ❌ Configuration système
- ❌ Gestion utilisateurs autres équipes
- ✅ Délégation limitée

#### Technicien 🔧
**Support technique**
- ✅ Monitoring serveurs/sessions
- ✅ Maintenance matériel
- ✅ Support utilisateurs niveau 1-2
- ✅ Gestion inventaire technique
- ✅ Résolution incidents
- ❌ Configuration sécurité
- ❌ Gestion utilisateurs
- ✅ Documentation technique

#### Observateur 👁️
**Consultation uniquement**
- ✅ Consultation tableau de bord
- ✅ Lecture documents autorisés
- ✅ Utilisation chat IA basique
- ✅ Consultation inventaire
- ❌ Modification données
- ❌ Création documents
- ❌ Gestion matériel
- ✅ Export rapports personnels

### Gestion Dynamique des Permissions

#### Héritage et Délégation
- **🏢 Hiérarchique** : Manager → équipiers
- **📁 Dossiers** : Permissions par projet
- **⏰ Temporaire** : Droits limités dans le temps
- **🎯 Contextuel** : Selon situation (urgence, absence)

#### Restrictions Granulaires
- **📄 Niveau document** : Lecture/écriture/suppression
- **🔍 Champs masqués** : Informations sensibles
- **📊 Données filtrées** : Vue partielle selon rôle
- **⏰ Plages horaires** : Accès selon horaires
- **🌍 Géo-restriction** : Accès selon localisation

### Audit et Conformité

#### Traçabilité Complète
- **👤 Qui** : Identification utilisateur
- **📅 Quand** : Horodatage précis
- **🎯 Quoi** : Action effectuée
- **📍 Où** : Localisation/IP
- **🔍 Détails** : Avant/après modification

#### Rapports Audit
- **📊 Tableaux de bord** : Activité temps réel
- **📋 Rapports planifiés** : Mensuel, trimestriel
- **🚨 Alertes sécurité** : Tentatives non autorisées
- **📈 Analytics** : Patterns d'utilisation

---

## 🔧 Paramètres et Personnalisation

### Préférences Utilisateur

#### Interface
- **🎨 Thème** : Clair, sombre, auto
- **🌍 Langue** : Français, Espagnol
- **🔔 Notifications** : Email, push, dans l'app
- **📊 Widgets** : Personnalisation tableau de bord

#### Fonctionnalités
- **🚀 Raccourcis** : Clavier personnalisés
- **📱 Synchronisation** : Multi-dispositifs
- **💾 Sauvegarde auto** : Fréquence
- **🔄 Actualisation** : Intervalles données

### Configuration Avancée

#### Intégrations
- **📧 Email** : SMTP, Exchange
- **📁 Active Directory** : Synchronisation
- **☁️ Cloud** : OneDrive, SharePoint
- **🤖 API externes** : Systèmes métier

#### Performance
- **💾 Cache** : Taille et durée
- **🖼️ Images** : Qualité compression
- **📊 Logs** : Niveau détail
- **⚡ Optimisations** : Mode performance

---

## 📞 Support et Aide

### Aide Intégrée
- **❓ Tooltips contextuels** : Survol éléments
- **📖 Documentation embarquée** : F1 sur modules
- **🎥 Tutoriels vidéo** : Pas à pas
- **🤖 Assistant IA** : Questions en langage naturel

### Contact Support
- **📧 Email** : support@anecoop.com
- **📞 Téléphone** : +33 X XX XX XX XX
- **💬 Chat** : Dans l'application
- **🎫 Tickets** : Système intégré

### Formation
- **👥 Sessions groupe** : Sur site ou distanciel
- **📚 Documentations** : Manuels PDF téléchargeables
- **🎯 Formation rôle** : Spécialisée par fonction
- **🏆 Certification** : Validation compétences

---

## 🔄 Mises à Jour et Évolutions

### Système de Mise à Jour
- **🔄 Auto-update** : Vérification automatique
- **📋 Notes versions** : Changelog détaillé
- **⏰ Planification** : Maintenance programmée
- **🔙 Rollback** : Retour version précédente

### Évolutions Prévues
- **🌐 Version web** : Accès navigateur
- **📱 App mobile native** : iOS/Android
- **🤖 IA avancée** : GPT-4 integration
- **☁️ Cloud hybrid** : Déploiement mixte

---

*Guide d'utilisation RDS Viewer Anecoop v3.0.27 - Dernière mise à jour : Novembre 2024*
*Pour toute question : support@anecoop.com | 📖 Documentation complète : docs.anecoop.com*