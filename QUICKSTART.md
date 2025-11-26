# ⚡ Démarrage Rapide AI-KO

Guide de démarrage rapide pour lancer l'infrastructure AI-KO en moins de 5 minutes.

## 📋 Prérequis

✅ **Docker Desktop** installé et démarré
- Windows/Mac: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Linux: Docker Engine + Docker Compose

✅ **Ports disponibles:**
- 3000 (Frontend)
- 5000 (Backend)
- 5432 (PostgreSQL)
- 6379 (Redis)
- 9090 (Prometheus)
- 3001 (Grafana)

✅ **Ressources minimales:**
- 8 GB RAM
- 20 GB disque libre
- Connexion internet (première fois)

## 🚀 Installation en 3 étapes

### 1. Configuration

```bash
# Cloner ou extraire le projet
cd ai-ko

# Copier le fichier d'environnement
cp env.example .env

# Éditer .env et changer les mots de passe
# Au minimum, changer: POSTGRES_PASSWORD, REDIS_PASSWORD, SECRET_KEY
```

**Windows PowerShell - Générer des secrets:**
```powershell
# Générer un secret aléatoire
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Linux/Mac - Générer des secrets:**
```bash
# Générer un secret aléatoire
openssl rand -hex 32
```

### 2. Démarrage

**Option A: Script automatique (recommandé)**

Windows PowerShell:
```powershell
.\scripts\deploy.ps1
```

Linux/Mac:
```bash
chmod +x scripts/*.sh
./scripts/deploy.sh
```

**Option B: Commandes manuelles**

```bash
# Build et démarrer
docker-compose up -d --build

# Attendre 30 secondes que les services démarrent
# Puis appliquer les migrations
docker-compose exec backend flask db upgrade
```

### 3. Vérification

**Script de status:**

Windows:
```powershell
.\scripts\status.ps1
```

Linux/Mac:
```bash
./scripts/status.sh
```

**Vérification manuelle:**

```bash
# Voir tous les services
docker-compose ps

# Tester le backend
curl http://localhost:5000/health

# Tester le frontend
curl http://localhost:3000/api/health
```

## 🌐 Accès aux Services

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Frontend** | http://localhost:3000 | - |
| **Backend API** | http://localhost:5000/health | - |
| **Grafana** | http://localhost:3001 | admin / (voir .env) |
| **Prometheus** | http://localhost:9090 | - |

## 📝 Commandes Utiles

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Backend uniquement
docker-compose logs -f backend

# Frontend uniquement
docker-compose logs -f frontend
```

### Arrêter/Redémarrer

```bash
# Arrêter tous les services
docker-compose down

# Redémarrer un service
docker-compose restart backend

# Redémarrer tous les services
docker-compose restart
```

### Accéder à un container

```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# PostgreSQL
docker-compose exec postgres psql -U smart_user systeme_intelligent

# Redis
docker-compose exec redis redis-cli
```

## 🐛 Résolution de Problèmes Courants

### Erreur: Port déjà utilisé

```bash
# Trouver le processus qui utilise le port (Windows)
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Changer le port dans .env
FRONTEND_PORT=3001
```

### Erreur: Container ne démarre pas

```bash
# Voir les logs d'erreur
docker-compose logs backend

# Rebuild le container
docker-compose up -d --build backend
```

### Erreur: Impossible de se connecter à la DB

```bash
# Vérifier que postgres est démarré
docker-compose ps postgres

# Voir les logs
docker-compose logs postgres

# Redémarrer postgres
docker-compose restart postgres
```

### Erreur: Out of memory

```bash
# Augmenter la mémoire Docker Desktop
# Settings → Resources → Memory → 8GB minimum

# Ou réduire les workers
# Dans .env:
GUNICORN_WORKERS=2
CELERY_WORKERS=1
```

## 💾 Backup et Restore

### Créer un backup

Windows:
```powershell
.\scripts\backup.ps1
```

Linux/Mac:
```bash
./scripts/backup.sh
```

Les backups sont sauvegardés dans le dossier `backups/`

### Restaurer un backup

```bash
# Lister les backups disponibles
ls backups/

# Restaurer (Linux/Mac)
./scripts/restore.sh 20250121_143000

# Restaurer manuellement
gunzip < backups/postgres_20250121_143000.sql.gz | \
  docker-compose exec -T postgres psql -U smart_user systeme_intelligent
```

## 🔧 Configuration Avancée

### Activer HTTPS (Production)

1. Obtenir un certificat SSL:
```bash
# Let's Encrypt
sudo certbot certonly --standalone -d yourdomain.com
```

2. Copier les certificats:
```bash
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/key.pem
```

3. Redémarrer Nginx:
```bash
docker-compose restart nginx
```

### Optimiser les Performances

Dans `.env`:
```bash
# Plus de workers pour backend
GUNICORN_WORKERS=8

# Plus de workers pour Celery
CELERY_WORKERS=4

# Augmenter la mémoire Redis
# Dans docker-compose.yml, ligne redis command:
--maxmemory 512mb
```

### Activer le Mode Debug

Dans `.env`:
```bash
FLASK_ENV=development
NODE_ENV=development
```

Puis redémarrer:
```bash
docker-compose restart backend frontend
```

## 📚 Prochaines Étapes

1. **Lire la documentation complète:** [README.md](README.md)
2. **Comprendre l'architecture:** [INFRASTRUCTURE.md](INFRASTRUCTURE.md)
3. **Développer des fonctionnalités:** Voir la structure dans `backend/` et `frontend/`
4. **Configurer le monitoring:** Accéder à Grafana et créer vos dashboards
5. **Configurer les backups automatiques:** Voir section Maintenance dans README.md

## 🆘 Support

En cas de problème:

1. **Vérifier les logs:** `docker-compose logs -f`
2. **Vérifier le status:** `./scripts/status.sh` ou `.\scripts\status.ps1`
3. **Restart complet:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```
4. **Consulter la documentation:** [README.md](README.md) et [INFRASTRUCTURE.md](INFRASTRUCTURE.md)

## ✅ Checklist de Vérification

Avant de considérer l'installation terminée:

- [ ] Tous les services affichent "Up" dans `docker-compose ps`
- [ ] Backend répond à http://localhost:5000/health
- [ ] Frontend répond à http://localhost:3000
- [ ] PostgreSQL est accessible
- [ ] Redis est accessible
- [ ] Grafana est accessible (http://localhost:3001)
- [ ] Prometheus collecte des métriques
- [ ] Les logs ne montrent pas d'erreurs critiques

## 🎉 C'est Parti!

Votre infrastructure AI-KO est maintenant opérationnelle!

Commencez à développer en modifiant:
- `backend/app/` pour l'API
- `frontend/app/` pour l'interface

Les changements seront automatiquement détectés en mode développement.

**Bon développement! 🚀**

---

Pour plus de détails, consultez [README.md](README.md)



