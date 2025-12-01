# Script de Synchronisation de Base de Données

Ce script permet de synchroniser les données de votre base de données PostgreSQL locale (Docker) vers la base de données de production.

## 📋 Prérequis

1. **PostgreSQL Docker en cours d'exécution** (base locale)
   ```bash
   docker-compose up -d postgres
   ```

2. **Variables d'environnement configurées**
   - `DATABASE_URL_PROD` : URL de connexion à la base de production
   - Optionnel : `DATABASE_URL_LOCAL` (par défaut: `postgresql://root:root@localhost:5432/systeme_intelligent`)

3. **Environnement virtuel Python activé**

## 🚀 Utilisation

### PowerShell (Windows)

```powershell
# Mode dry-run (test sans modification)
.\backend\scripts\sync_db_to_prod.ps1 --dry-run

# Synchronisation normale (ignore les enregistrements existants)
.\backend\scripts\sync_db_to_prod.ps1

# Synchronisation avec mise à jour des enregistrements existants
.\backend\scripts\sync_db_to_prod.ps1 --update-existing

# Spécifier l'URL de production directement
.\backend\scripts\sync_db_to_prod.ps1 --prod-db-url "postgresql://user:pass@host:5432/dbname"
```

### Bash (Linux/Mac/WSL)

```bash
# Rendre le script exécutable (première fois seulement)
chmod +x backend/scripts/sync_db_to_prod.sh

# Mode dry-run (test sans modification)
./backend/scripts/sync_db_to_prod.sh --dry-run

# Synchronisation normale (ignore les enregistrements existants)
./backend/scripts/sync_db_to_prod.sh

# Synchronisation avec mise à jour des enregistrements existants
./backend/scripts/sync_db_to_prod.sh --update-existing

# Spécifier l'URL de production directement
./backend/scripts/sync_db_to_prod.sh --prod-db-url "postgresql://user:pass@host:5432/dbname"
```

### Python direct

```bash
cd backend
source venv/bin/activate  # ou venv\Scripts\activate.ps1 sur Windows

python scripts/sync_db_to_prod.py --dry-run
python scripts/sync_db_to_prod.py --update-existing
python scripts/sync_db_to_prod.py --prod-db-url "postgresql://user:pass@host:5432/dbname"
```

## ⚙️ Configuration

### Ajouter DATABASE_URL_PROD dans .env

Ajoutez cette ligne dans votre fichier `.env` à la racine du projet :

```env
DATABASE_URL_PROD=postgresql://username:password@host:5432/database_name
```

**Exemple pour un serveur distant :**
```env
DATABASE_URL_PROD=postgresql://myuser:mypassword@192.168.1.100:5432/systeme_intelligent
```

**Exemple pour une base de données cloud (AWS RDS, etc.) :**
```env
DATABASE_URL_PROD=postgresql://admin:secure_password@my-db-instance.region.rds.amazonaws.com:5432/systeme_intelligent
```

## 🔧 Options

### `--dry-run`
Affiche ce qui serait fait sans effectuer les modifications. Utile pour tester avant la synchronisation réelle.

### `--update-existing`
Par défaut, les enregistrements qui existent déjà dans la production sont ignorés. Avec cette option, ils seront mis à jour avec les valeurs de la base locale.

### `--local-db-url`
Spécifie l'URL de connexion à la base locale (par défaut: `postgresql://root:root@localhost:5432/systeme_intelligent`)

### `--prod-db-url`
Spécifie l'URL de connexion à la base de production (alternative à `DATABASE_URL_PROD`)

## 📊 Ordre de Synchronisation

Le script synchronise les tables dans l'ordre suivant pour respecter les dépendances :

1. **niveaux** - Niveaux universitaires (L1, L2, M1, etc.)
2. **matieres** - Matières enseignées
3. **users** - Utilisateurs (étudiants, professeurs, admins)
4. **classes** - Classes/groupes d'étudiants (dépend de niveaux)
5. **questions** - Questions de QCM (dépend de users)
6. **qcms** - QCMs (dépend de users, matieres)
7. **session_examens** - Sessions d'examen (dépend de users, qcms, classes)
8. **resultats** - Résultats d'examens (dépend de users, session_examens)
9. **Tables d'association** :
   - professeur_matieres
   - professeur_niveaux
   - etudiant_niveaux
   - etudiant_classes
   - professeur_classes
   - qcm_niveaux

## ⚠️ Avertissements

1. **Sauvegarde recommandée** : Faites une sauvegarde de votre base de production avant la synchronisation
2. **Mode dry-run** : Utilisez toujours `--dry-run` d'abord pour vérifier ce qui sera synchronisé
3. **Conflits** : Les enregistrements avec des clés primaires identiques seront ignorés (ou mis à jour avec `--update-existing`)
4. **Transactions** : Toutes les modifications sont effectuées dans une transaction et peuvent être annulées en cas d'erreur

## 📈 Statistiques

Le script affiche des statistiques détaillées à la fin :
- Nombre de tables traitées
- Nombre de lignes insérées
- Nombre de lignes mises à jour
- Nombre de lignes ignorées
- Nombre d'erreurs

## 🐛 Dépannage

### Erreur de connexion
- Vérifiez que PostgreSQL Docker est en cours d'exécution : `docker ps | grep smart-system-db`
- Vérifiez les credentials dans l'URL de connexion
- Vérifiez que le serveur de production est accessible depuis votre machine

### Erreur "Table n'existe pas"
- Vérifiez que les migrations ont été exécutées sur les deux bases de données
- Exécutez `flask db upgrade` sur les deux environnements

### Erreur de permissions
- Vérifiez que l'utilisateur de la base de production a les droits INSERT/UPDATE
- Vérifiez que les contraintes de clés étrangères sont respectées

## 📝 Exemple Complet

```bash
# 1. Vérifier que Docker PostgreSQL est en cours d'exécution
docker ps | grep smart-system-db

# 2. Tester la synchronisation (dry-run)
./backend/scripts/sync_db_to_prod.sh --dry-run

# 3. Si tout semble correct, exécuter la synchronisation réelle
./backend/scripts/sync_db_to_prod.sh

# 4. Vérifier les statistiques affichées
```

## 🔒 Sécurité

- Ne commitez jamais les fichiers `.env` contenant les mots de passe
- Utilisez des variables d'environnement ou des secrets managers en production
- Limitez l'accès réseau à votre base de production (firewall, VPN, etc.)

