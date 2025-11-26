# Guide de Déploiement VPS - AI-KO Smart System

## 📋 Prérequis

### Serveur VPS
- **OS** : Ubuntu 20.04+ / Debian 11+ (recommandé)
- **RAM** : Minimum 2GB (4GB recommandé)
- **CPU** : 2 cores minimum
- **Disque** : 20GB minimum
- **Réseau** : Ports 80, 443 ouverts

### Logiciels requis
- Docker 20.10+
- Docker Compose 2.0+ (ou `docker compose` plugin)
- Git

### Domaine (optionnel mais recommandé)
- Un domaine pointant vers l'IP du VPS
- Pour SSL/HTTPS avec Let's Encrypt

## 🚀 Installation sur VPS

### Étape 1: Préparation du serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt install docker-compose-plugin -y

# Vérifier l'installation
docker --version
docker compose version

# Ajouter l'utilisateur au groupe docker (optionnel)
sudo usermod -aG docker $USER
# Déconnexion/reconnexion nécessaire pour que cela prenne effet
```

### Étape 2: Cloner le projet

```bash
# Cloner le repository
git clone <votre-repo-url> ai-ko
cd ai-ko

# Ou si vous avez déjà le code, assurez-vous d'être dans le bon répertoire
```

### Étape 3: Configuration des variables d'environnement

```bash
# Copier le fichier d'exemple
cp env.example .env

# Éditer le fichier .env
nano .env  # ou vim, ou votre éditeur préféré
```

**Variables critiques à configurer :**

```env
# ⚠️ OBLIGATOIRE - Changez ces valeurs !
SECRET_KEY=votre_secret_key_aleatoire_min_32_caracteres
JWT_SECRET_KEY=votre_jwt_secret_key_aleatoire
POSTGRES_PASSWORD=mot_de_passe_postgres_securise
REDIS_PASSWORD=mot_de_passe_redis_securise

# Hugging Face (pour l'IA)
HF_API_TOKEN=votre_token_huggingface

# Frontend
NEXT_PUBLIC_API_URL=https://votre-domaine.com  # ou http://IP_DU_VPS:5000
NEXTAUTH_SECRET=votre_nextauth_secret
NEXTAUTH_URL=https://votre-domaine.com  # ou http://IP_DU_VPS:3000

# CORS (ajoutez votre domaine)
CORS_ORIGINS=https://votre-domaine.com,http://IP_DU_VPS:3000

# Monitoring (optionnel)
GRAFANA_PASSWORD=mot_de_passe_grafana
```

**Génération de secrets sécurisés :**

```bash
# Générer des secrets aléatoires
openssl rand -hex 32  # Pour SECRET_KEY, JWT_SECRET_KEY, NEXTAUTH_SECRET
```

### Étape 4: Déploiement

#### Option A: Déploiement simple (sans SSL)

```bash
# Rendre les scripts exécutables
chmod +x scripts/*.sh

# Déploiement de base
./scripts/deploy.sh
```

#### Option B: Déploiement avec SSL (Let's Encrypt)

```bash
# 1. Initialiser SSL (remplacez par votre domaine et email)
DOMAIN=votre-domaine.com
EMAIL=admin@votre-domaine.com
./scripts/init-ssl.sh "$DOMAIN" "$EMAIL"

# 2. Déployer avec initialisation de la base de données
INIT_DB=true ./scripts/deploy.sh
```

#### Option C: Déploiement complet (SSL + DB)

```bash
# Tout en une commande
DOMAIN=votre-domaine.com \
SSL_EMAIL=admin@votre-domaine.com \
INIT_SSL=true \
INIT_DB=true \
./scripts/deploy.sh
```

### Étape 5: Vérification

```bash
# Vérifier le statut des services
docker-compose ps

# Vérifier les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Tester les endpoints
curl http://localhost:5000/health
curl http://localhost:3000/api/health
```

## 🔐 Configuration SSL/HTTPS

### Méthode 1: Let's Encrypt (automatique)

```bash
# Initialiser les certificats
./scripts/init-ssl.sh votre-domaine.com admin@votre-domaine.com

# Les certificats seront renouvelés automatiquement via Certbot
```

### Méthode 2: Certificats manuels

Si vous avez vos propres certificats :

```bash
# Placer les certificats dans nginx/ssl/
cp votre-cert.pem nginx/ssl/cert.pem
cp votre-key.pem nginx/ssl/key.pem

# Redémarrer Nginx
docker-compose restart nginx
```

### Renouvellement automatique

Le service Certbot dans `docker-compose.yml` renouvelle automatiquement les certificats toutes les 12 heures. Pour forcer un renouvellement :

```bash
docker-compose run --rm certbot renew --force-renewal
```

## 🗄️ Initialisation de la base de données

### Initialisation complète (recommandée)

```bash
# Créer les tables, seed les données, créer un admin
./scripts/init-db-complete.sh admin@example.com motdepasse123 "Nom Admin"
```

### Initialisation manuelle

```bash
# Migrations uniquement
docker-compose exec backend flask db upgrade

# Créer un admin
docker-compose exec backend python create_admin.py admin@example.com "Nom Admin" motdepasse123

# Seed des données éducatives
docker-compose exec backend python scripts/seed_niveaux_matieres.py
```

## 🔧 Maintenance

### Mise à jour

```bash
# Pull les dernières modifications
git pull

# Rebuild et redéployer
./scripts/deploy.sh
```

### Sauvegarde

```bash
# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U root systeme_intelligent > backup_$(date +%Y%m%d).sql

# Restaurer
docker-compose exec -T postgres psql -U root systeme_intelligent < backup_YYYYMMDD.sql
```

### Logs

```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Dernières 100 lignes
docker-compose logs --tail=100 backend
```

### Redémarrage

```bash
# Redémarrer tous les services
docker-compose restart

# Redémarrer un service spécifique
docker-compose restart backend

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ supprime les données)
docker-compose down -v
```

## 🐛 Dépannage

### Services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs [service]

# Vérifier les variables d'environnement
docker-compose config

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h
```

### Problèmes de connexion à la base de données

```bash
# Vérifier que PostgreSQL est en cours d'exécution
docker-compose ps postgres

# Tester la connexion
docker-compose exec postgres psql -U root -d systeme_intelligent -c "SELECT 1;"

# Vérifier les logs PostgreSQL
docker-compose logs postgres
```

### Problèmes SSL

```bash
# Vérifier les certificats
ls -la nginx/ssl/

# Vérifier la configuration Nginx
docker-compose exec nginx nginx -t

# Regénérer les certificats
./scripts/init-ssl.sh votre-domaine.com votre-email@example.com
```

### Problèmes de build

```bash
# Nettoyer les images et rebuild
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Monitoring

### Accès aux dashboards

- **Prometheus** : http://VOTRE_IP:9090
- **Grafana** : http://VOTRE_IP:3001
  - Utilisateur par défaut : `admin`
  - Mot de passe : défini dans `.env` (`GRAFANA_PASSWORD`)

### Métriques disponibles

- Métriques Flask via Prometheus
- Métriques système (CPU, RAM, disque)
- Métriques de base de données
- Métriques Redis

## 🔒 Sécurité

### Checklist de sécurité

- [ ] Variables d'environnement sécurisées (pas de valeurs par défaut)
- [ ] Certificats SSL configurés
- [ ] Firewall configuré (ports 80, 443 uniquement)
- [ ] Mots de passe forts pour PostgreSQL, Redis, Grafana
- [ ] Backups réguliers de la base de données
- [ ] Mises à jour régulières du système et des images Docker

### Configuration du firewall (UFW)

```bash
# Installer UFW
sudo apt install ufw -y

# Autoriser SSH (important !)
sudo ufw allow 22/tcp

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier le statut
sudo ufw status
```

## 📝 Notes importantes

1. **Premier démarrage** : Le premier démarrage peut prendre plusieurs minutes (build des images, téléchargement des dépendances)

2. **Mémoire** : Si vous avez moins de 2GB de RAM, vous devrez peut-être réduire le nombre de workers Gunicorn dans `.env` :
   ```env
   GUNICORN_WORKERS=2
   CELERY_WORKERS=1
   ```

3. **Domaine vs IP** : Si vous n'avez pas de domaine, utilisez l'IP du VPS dans les variables d'environnement

4. **Ports** : Assurez-vous que les ports 80, 443 (et éventuellement 3000, 5000 pour tests) sont ouverts

## 🆘 Support

En cas de problème :
1. Vérifiez les logs : `docker-compose logs`
2. Vérifiez le statut : `docker-compose ps`
3. Consultez `DEPLOYMENT_VPS_ANALYSIS.md` pour l'analyse détaillée
4. Vérifiez que toutes les variables d'environnement sont correctement configurées

