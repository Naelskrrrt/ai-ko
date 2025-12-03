# Configuration des Environnements - Résumé

## Fichiers Créés

### 1. Fichiers d'Environnement

| Fichier | Description | À Commiter ? |
|---------|-------------|--------------|
| `.env` | Fichier actif (géré automatiquement) | ❌ NON |
| `.env.dev` | Configuration développement | ✅ OUI |
| `.env.prod` | Template production (sans secrets) | ✅ OUI |
| `.env.template` | Template vide | ✅ OUI |
| `.env.backup.*` | Sauvegardes automatiques | ❌ NON |

### 2. Scripts de Basculement

| Fichier | Description | Plateforme |
|---------|-------------|------------|
| `switch-env.ps1` | Script PowerShell | Windows |
| `switch-env.sh` | Script Bash | Linux/Mac |

### 3. Fichiers de Configuration Docker

| Fichier | Description | Usage |
|---------|-------------|-------|
| `docker-compose.yml` | Config production | Prod |
| `docker-compose.dev.yml` | Config développement | Dev |

### 4. Helpers de Commandes

| Fichier | Description | Plateforme |
|---------|-------------|------------|
| `Makefile` | Commandes Make | Linux/Mac |
| `commands.ps1` | Commandes PowerShell | Windows |

### 5. Documentation

| Fichier | Description |
|---------|-------------|
| `ENV_SETUP_GUIDE.md` | Guide complet |
| `QUICK_START.md` | Démarrage rapide |
| `README.md` | Mis à jour |

## Workflow d'Utilisation

### Pour le Développement Local

```bash
# 1. Basculer vers dev
.\switch-env.ps1 dev   # Windows
./switch-env.sh dev    # Linux/Mac

# 2. Démarrer Docker
docker-compose -f docker-compose.dev.yml up -d

# 3. Vérifier les services
docker-compose ps

# 4. Accéder
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Pour la Production (Railway)

```bash
# 1. Basculer vers prod
.\switch-env.ps1 prod   # Windows
./switch-env.sh prod    # Linux/Mac

# 2. Configurer les variables dans Railway UI
# Aller sur Railway Dashboard > Variables

# 3. Déployer
cd backend
railway up
```

## Configuration Railway (Production)

### Variables à Configurer dans Railway UI

#### Backend Service

```env
# Fournis automatiquement par Railway
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# À configurer manuellement
SECRET_KEY=<générer avec openssl rand -hex 32>
JWT_SECRET_KEY=<générer avec openssl rand -hex 32>
HF_API_TOKEN=<votre token Hugging Face>
GOOGLE_CLIENT_ID=<votre client ID>
GOOGLE_CLIENT_SECRET=<votre client secret>
CORS_ORIGINS=https://your-frontend.vercel.app

# Configuration
FLASK_ENV=production
FLASK_DEBUG=0
GUNICORN_WORKERS=4
CELERY_WORKERS=4
```

#### Frontend Service (Vercel)

Configurer dans Vercel Dashboard > Settings > Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXTAUTH_SECRET=<générer avec openssl rand -hex 32>
NEXTAUTH_URL=https://your-frontend.vercel.app
BETTER_AUTH_SECRET=<générer avec openssl rand -hex 32>
BETTER_AUTH_URL=https://your-frontend.vercel.app
GOOGLE_CLIENT_ID=<votre client ID>
GOOGLE_CLIENT_SECRET=<votre client secret>
GOOGLE_REDIRECT_URI=https://your-frontend.vercel.app/api/auth/callback/google
```

## Génération de Secrets

### Linux/Mac/Git Bash

```bash
# Générer un secret de 32 caractères
openssl rand -hex 32
```

### Windows PowerShell

```powershell
# Générer un secret aléatoire
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Ou plus simple
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Commandes Rapides

### Avec PowerShell Helper (Windows)

```powershell
# 1. Charger les commandes
. .\commands.ps1

# 2. Utiliser
Dev              # Basculer vers dev
Up               # Démarrer les services
Logs             # Voir les logs
Logs backend     # Logs du backend seulement
Down             # Arrêter
Restart          # Redémarrer
Build            # Rebuild
Clean            # Tout nettoyer (attention!)
Health           # Vérifier la santé
Help             # Voir toutes les commandes
```

### Avec Make (Linux/Mac)

```bash
make help           # Voir toutes les commandes
make dev            # Basculer vers dev
make up             # Démarrer
make logs           # Logs
make logs-backend   # Logs backend
make down           # Arrêter
make restart        # Redémarrer
make build          # Rebuild
make clean          # Nettoyer
make health         # Vérifier santé
```

### Manuel (Cross-platform)

```bash
# Développement
docker-compose -f docker-compose.dev.yml up -d
docker-compose logs -f
docker-compose down

# Migrations
docker-compose exec backend flask db upgrade
docker-compose exec backend flask db migrate -m "description"

# Tests
docker-compose exec backend pytest

# Shell
docker-compose exec backend bash
docker-compose exec postgres psql -U root systeme_intelligent_dev
```

## Checklist Première Installation

### Développement

- [ ] Cloner le projet
- [ ] Exécuter `.\switch-env.ps1 dev` ou `./switch-env.sh dev`
- [ ] Vérifier que `.env` a été créé
- [ ] Démarrer Docker Desktop
- [ ] Exécuter `docker-compose -f docker-compose.dev.yml up -d`
- [ ] Attendre que tous les services soient "healthy"
- [ ] Accéder à http://localhost:3000
- [ ] Accéder à http://localhost:5000/health

### Production

- [ ] Créer un compte Railway
- [ ] Créer un nouveau projet
- [ ] Ajouter PostgreSQL addon
- [ ] Ajouter Redis addon
- [ ] Configurer toutes les variables d'environnement
- [ ] Générer des secrets forts
- [ ] Déployer le backend: `railway up`
- [ ] Configurer Vercel avec le repo GitHub
- [ ] Configurer les variables Vercel
- [ ] Tester l'application en production

## Différences Dev vs Prod

| Aspect | Développement | Production |
|--------|--------------|------------|
| Base de données | PostgreSQL Docker | PostgreSQL Railway |
| Redis | Redis Docker | Redis Railway |
| Backend | localhost:5000 | Railway URL |
| Frontend | localhost:3000 | Vercel URL |
| FLASK_ENV | development | production |
| FLASK_DEBUG | 1 | 0 |
| Hot-reload | ✅ Activé | ❌ Désactivé |
| SSL/HTTPS | ❌ HTTP | ✅ HTTPS |
| Workers | 2 | 4 |
| Logs | Verbeux | Production |

## Sécurité

### À Ne Jamais Commiter

- `.env` (fichier actif)
- `.env.backup.*` (sauvegardes)
- Secrets réels dans `.env.prod`
- Certificats SSL
- API Keys réelles

### À Commiter

- `.env.dev` (valeurs de dev non sensibles)
- `.env.prod` (template avec `${VAR}` placeholders)
- `.env.template` (template vide)
- Scripts de configuration
- Documentation

### Bonne Pratique

1. Utiliser `.env.prod` comme template uniquement
2. Configurer les vraies valeurs dans Railway/Vercel UI
3. Générer des secrets uniques pour chaque environnement
4. Ne jamais réutiliser les secrets de dev en prod
5. Faire une rotation régulière des secrets

## Support

### Problèmes Communs

1. **Script ne s'exécute pas (Windows)**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Script ne s'exécute pas (Linux/Mac)**
   ```bash
   chmod +x switch-env.sh
   chmod +x *.sh
   ```

3. **Port déjà utilisé**
   - Changer les ports dans `.env.dev`
   - Ou arrêter le processus utilisant le port

4. **Docker ne démarre pas**
   - Vérifier que Docker Desktop est lancé
   - Redémarrer Docker Desktop
   - Vérifier les logs: `docker-compose logs`

### Ressources

- **Guide complet**: [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)
- **Démarrage rapide**: [QUICK_START.md](./QUICK_START.md)
- **README principal**: [README.md](./README.md)
- **Docker Compose Dev**: [docker-compose.dev.yml](./docker-compose.dev.yml)

---

**Configuration effectuée le**: 2025-12-02
**Prochaine étape**: Exécuter `.\switch-env.ps1 dev` et démarrer Docker !
