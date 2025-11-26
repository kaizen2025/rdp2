# 📖 Guide Utilisateur - DocuCortex Enhanced

**Version** : 3.0.29
**Date** : 17 Novembre 2025
**Statut** : ✅ Production Ready

---

## 🎯 Nouvelles Fonctionnalités

Ce guide explique comment utiliser les nouvelles fonctionnalités DocuCortex Enhanced intégrées dans RDP2.

---

## 1. 📊 Dashboard Amélioré

### KPI Widgets Modernes

En haut de la page Dashboard, vous verrez maintenant 4 cartes KPI colorées :

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ MATÉRIEL TOTAL  │  │ PRÊTS ACTIFS    │  │ EN RETARD       │  │ HISTORIQUE      │
│                 │  │                 │  │                 │  │                 │
│      245        │  │       32        │  │       5         │  │      1,248      │
│   ↗ +2.5%       │  │   ↘ -3.2%       │  │   ↘ -12.5%      │  │   ↗ +8.3%       │
│                 │  │                 │  │                 │  │                 │
│ 178 disponibles │  │ 12 réservés     │  │ 2 critiques     │  │ Total effectués │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Fonctionnalités** :
- ✅ **Gradient de couleurs** : Bleu / Cyan / Rouge / Vert
- ✅ **Icône décorative** : En arrière-plan avec transparence
- ✅ **Tendance** : Flèche ↗ (hausse) ou ↘ (baisse) avec %
- ✅ **Animation** : Survol = carte monte légèrement
- ✅ **Responsive** : S'adapte mobile/tablette/desktop

### Serveurs RDS - Métriques Visuelles

Chaque serveur RDS affiche maintenant ses métriques avec **barres de progression** :

```
✅ SRV-RDS-1

CPU     45.2%   [███████████░░░░░░░░] Vert
RAM     62.5%   [████████████░░░░░░░] Orange
Disque  125GB / 500GB (25.0%) [█████░░░░░░░░░░] Vert
```

**Code couleurs** :
- 🟢 **Vert** : 0-60% (normal)
- 🟠 **Orange** : 60-80% (attention)
- 🔴 **Rouge** : 80-100% (critique)

**Actions** :
- 🤖 **Bouton IA** : Cliquez pour analyser avec DocuCortex IA

---

## 2. 👤 Gestion Utilisateurs Enrichie

### Nouveaux Champs

Lors de l'édition d'un utilisateur (bouton ✏️), vous verrez maintenant :

**Nouveaux champs** :
- 📱 **Téléphone portable** : Format validé (06 12 34 56 78)
- 🔐 **Code PUK** : 8 chiffres (12345678)
- 📅 **Date de création** : Auto (lecture seule)
- 📅 **Date de modification** : Auto (lecture seule)

**Validation automatique** :
- ✅ Téléphone : Format français accepté (06, 07, +33)
- ✅ Code PUK : Exactement 8 chiffres
- ❌ Messages d'erreur si format invalide

### Actions en Lot

**Sélectionnez plusieurs utilisateurs** en cochant les cases :

```
┌─────────────────────────────────────────────────────────────┐
│ 🔵 5 utilisateurs sélectionnés (25%)                        │
│                                                             │
│  [Exporter]  [Imprimer]  📧  🔑  │  [Supprimer]  [✕]        │
└─────────────────────────────────────────────────────────────┘
```

**Actions disponibles** :

1. **📥 Exporter** : Télécharge un fichier CSV
   - Format : `utilisateurs_5_2025-11-17.csv`
   - Colonnes : Nom, Identifiant, Email, Service, Serveur, Téléphone, Code PUK
   - Encodage : UTF-8 avec BOM (compatible Excel)

2. **🖨️ Imprimer** : Génère les fiches de tous les utilisateurs sélectionnés
   - Une page par utilisateur
   - Toutes les informations incluses

3. **📧 Email** : (À venir) Envoyer un email groupé

4. **🔑 VPN** : (À venir) Ajouter/Retirer du groupe VPN en masse

5. **🗑️ Supprimer** : Supprime tous les utilisateurs sélectionnés
   - ⚠️ Confirmation requise
   - Compteur succès/erreurs
   - Notification pour chaque action

**Raccourci** :
- Cochez la case dans l'en-tête pour **tout sélectionner**

---

## 3. 🤖 DocuCortex IA

### Accès

Cliquez sur l'onglet **"IA Assistant"** dans le menu principal.

### 5 Onglets Disponibles

#### 📈 1. Prédictions

**Ce que vous voyez** :
- Prévisions de demande d'équipements (7, 14, 30 jours)
- Risques de retard pour les prêts en cours
- Patterns saisonniers identifiés

**Exemple** :
```
🔮 Prédiction : Demande en hausse de 15% pour "HP EliteBook"
   Basé sur : Historique 3 mois + Tendance saisonnière
   Confiance : 87%
   Action : Prévoir 3 unités supplémentaires
```

#### 💡 2. Recommandations

**Ce que vous voyez** :
- Suggestions personnalisées par utilisateur
- Optimisations des politiques de prêt
- Recommandations de maintenance préventive

**Exemple** :
```
💡 Recommandation : Ajuster durée de prêt pour "Service RH"
   Observation : 90% des prêts RH dépassent 14 jours
   Suggestion : Passer de 7 à 14 jours par défaut
   Impact : -30% retards prévisionnels
```

#### ⚠️ 3. Détection Anomalies

**Ce que vous voyez** :
- Comportements suspects détectés
- Utilisateurs à risque de retard
- Abus d'équipement identifiés

**Exemple** :
```
⚠️ Anomalie détectée : john.doe
   Pattern : 5 retards consécutifs sur 2 mois
   Sévérité : Moyenne
   Recommandation : Contact personnalisé + Rappel procédure
```

#### 📊 4. Analyse Tendances

**Ce que vous voyez** :
- Graphiques d'évolution (7j, 30j, 90j)
- Comparaisons période sur période
- Identification de pics/creux

**Métriques** :
- Nombre de prêts
- Nombre d'utilisateurs actifs
- Types de documents les plus demandés
- Taux de retard

#### ⚡ 5. Optimisation

**Ce que vous voyez** :
- État actuel des ressources
- Goulots d'étranglement identifiés
- Actions d'optimisation suggérées

**Exemple** :
```
⚡ Optimisation suggérée : Répartition serveurs RDS
   Actuel : SRV-RDS-1 (CPU 85%), SRV-RDS-2 (CPU 30%)
   Suggestion : Migrer 15 utilisateurs vers SRV-RDS-2
   Gain : -40% charge SRV-RDS-1, répartition équilibrée
```

### 🔒 Confidentialité IA

**100% Local** :
- ✅ Aucune donnée envoyée au cloud
- ✅ Calculs TensorFlow.js en local
- ✅ Stockage IndexedDB + localStorage
- ✅ Conformité RGPD totale

**Technologies** :
- TensorFlow.js (prédictions)
- K-Means (clustering)
- Levenshtein (similarité)

---

## 4. 📤 Export CSV Enrichi

### Colonnes Exportées

Quand vous exportez des utilisateurs :

```csv
Nom complet;Identifiant;Email;Service;Serveur;Téléphone;Code PUK
Jean Dupont;jean.dupont;jean.dupont@example.com;RH;SRV-RDS-1;0612345678;12345678
Marie Martin;marie.martin;marie.martin@example.com;Compta;SRV-RDS-2;0687654321;87654321
```

**Format** :
- Séparateur : point-virgule (`;`)
- Encodage : UTF-8 avec BOM (pour Excel)
- Extension : `.csv`

### Ouvrir dans Excel

1. **Double-clic** sur le fichier `.csv`
2. Excel ouvre directement avec les bonnes colonnes
3. Pas besoin d'import manuel

---

## 5. 🎨 Améliorations Visuelles

### Dashboard

**Avant** :
```
CPU: 25.00% | Stockage: 0 Bytes libres sur 0 Bytes
```

**Maintenant** :
```
SRV-RDS-1 [🟢]

CPU     25.0%   [█████░░░░░░░░░░░░░░]
RAM     42.5%   [█████████░░░░░░░░░░]
Disque  120GB / 500GB (24%)  [████░░░░░░░░░░░░]
```

### KPI Widgets

**Effets visuels** :
- 🎨 Gradients de couleurs
- ✨ Animations au survol
- 📊 Tendances avec flèches
- 🎯 Valeurs formatées (1,248 au lieu de 1248)

---

## 6. 📱 Responsive

Toutes les nouvelles fonctionnalités s'adaptent :

**Mobile (xs)** :
- KPI widgets empilés verticalement
- Barre d'actions en lot sur 2 lignes
- Tableaux avec scroll horizontal

**Tablette (sm/md)** :
- 2 KPI widgets par ligne
- Barre d'actions optimisée

**Desktop (lg/xl)** :
- 4 KPI widgets en ligne
- Toutes fonctionnalités visibles

---

## 7. ⌨️ Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+A` | Tout sélectionner (dans liste utilisateurs) |
| `Suppr` | Supprimer sélection |
| `Ctrl+E` | Exporter sélection |
| `Ctrl+P` | Imprimer sélection |
| `Échap` | Désélectionner tout |

---

## 8. 💡 Conseils d'Utilisation

### Dashboard

- 🔄 Actualise automatiquement toutes les 30 secondes
- 🤖 Cliquez sur l'icône IA pour analyser un serveur RDS
- 📊 Les tendances se basent sur les 7 derniers jours

### Actions en Lot

- ✅ Sélectionnez jusqu'à 100 utilisateurs
- 📥 Exportez régulièrement pour backup
- 🗑️ Suppression en lot = gain de temps

### IA DocuCortex

- 🔄 Auto-entraînement : chaque nuit à 2h
- 📈 Plus de données = meilleurs prédictions
- ⚙️ Ajustez sensibilité dans Paramètres

---

## 9. 🐛 Dépannage

### "IA Désactivée"

**Cause** : Navigateur incompatible
**Solution** : Utilisez Chrome, Edge, ou Firefox récent

### Export CSV vide

**Cause** : Aucun utilisateur sélectionné
**Solution** : Cochez au moins une case avant d'exporter

### Barres de progression à 0%

**Cause** : Serveur RDS hors ligne
**Solution** : Vérifiez connexion réseau au serveur

### Tendances KPI incorrectes

**Cause** : Pas assez d'historique
**Solution** : Attendez 7 jours minimum de données

---

## 10. 📞 Support

**Documentation complète** :
- `docs/INTEGRATION_DOCUCORTEX_RAPPORT.md`
- `docs/docucortex-enhanced/`

**Composants** :
- `src/components/ai/` : IA DocuCortex
- `src/components/dashboard/` : Widgets
- `src/components/users/` : Gestion utilisateurs

---

**🎉 Profitez de DocuCortex Enhanced !**

