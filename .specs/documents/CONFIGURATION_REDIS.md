# Configuration Redis pour Celery

## Problème d'authentification

Si vous rencontrez l'erreur `redis.exceptions.AuthenticationError: Authentication required`, cela signifie que votre instance Redis nécessite une authentification mais que Celery n'est pas configuré pour l'utiliser.

## Solution

### Option 1 : Configuration via variables d'environnement (Recommandé)

Ajoutez les variables suivantes dans votre fichier `.env` :

```bash
# Configuration Redis de base
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=votre_mot_de_passe_redis
REDIS_USERNAME=default  # Optionnel, seulement si Redis 6+ avec ACL

# Bases de données Redis pour Celery
REDIS_BROKER_DB=0      # Base pour le broker Celery
REDIS_RESULT_DB=1      # Base pour les résultats Celery
```

### Option 2 : URLs complètes

Si vous préférez spécifier les URLs complètes :

```bash
# URLs Redis complètes avec authentification
CELERY_BROKER_URL=redis://:votre_mot_de_passe@localhost:6379/0
CELERY_RESULT_BACKEND=redis://:votre_mot_de_passe@localhost:6379/1
```

**Format de l'URL Redis avec authentification :**
- Sans username: `redis://:password@host:port/db`
- Avec username: `redis://username:password@host:port/db`

### Option 3 : Redis sans authentification (Développement local)

Si votre Redis local n'a pas de mot de passe, vous pouvez simplement ne pas définir `REDIS_PASSWORD` :

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD non défini = pas d'authentification
```

## Vérification de la configuration

### 1. Vérifier que Redis est démarré

```bash
# Windows
redis-cli ping
# Devrait répondre: PONG

# Linux/Mac
redis-cli ping
```

### 2. Tester la connexion avec authentification

```bash
# Si Redis a un mot de passe
redis-cli -a votre_mot_de_passe ping
```

### 3. Vérifier la configuration Celery

Les logs au démarrage de l'application afficheront les URLs Redis utilisées (sans le mot de passe pour la sécurité).

## Configuration Redis pour production

### Redis avec mot de passe

1. **Définir un mot de passe dans redis.conf :**
```conf
requirepass votre_mot_de_passe_securise
```

2. **Redémarrer Redis :**
```bash
# Linux
sudo systemctl restart redis

# Windows (via services)
# Redémarrer le service Redis
```

3. **Configurer les variables d'environnement :**
```bash
REDIS_PASSWORD=votre_mot_de_passe_securise
```

### Redis avec ACL (Redis 6+)

Pour une sécurité renforcée, utilisez les ACLs :

```bash
REDIS_USERNAME=celery_user
REDIS_PASSWORD=mot_de_passe_acl
```

## Dépannage

### Erreur : "Authentication required"

**Cause :** Redis nécessite une authentification mais `REDIS_PASSWORD` n'est pas défini.

**Solution :** Ajoutez `REDIS_PASSWORD` dans votre `.env` ou désactivez l'authentification dans Redis.

### Erreur : "Connection refused"

**Cause :** Redis n'est pas démarré ou n'est pas accessible.

**Solution :** 
1. Vérifiez que Redis est démarré : `redis-cli ping`
2. Vérifiez `REDIS_HOST` et `REDIS_PORT` dans votre `.env`

### Erreur : "Invalid password"

**Cause :** Le mot de passe fourni est incorrect.

**Solution :** Vérifiez que `REDIS_PASSWORD` correspond au mot de passe configuré dans Redis.

## Variables d'environnement disponibles

| Variable | Description | Défaut | Exemple |
|----------|-------------|--------|---------|
| `REDIS_HOST` | Hôte Redis | `localhost` | `localhost`, `127.0.0.1`, `redis.example.com` |
| `REDIS_PORT` | Port Redis | `6379` | `6379`, `6380` |
| `REDIS_PASSWORD` | Mot de passe Redis | `None` | `mon_mot_de_passe` |
| `REDIS_USERNAME` | Nom d'utilisateur Redis (ACL) | `None` | `celery_user` |
| `REDIS_BROKER_DB` | Base de données pour le broker | `0` | `0`, `1` |
| `REDIS_RESULT_DB` | Base de données pour les résultats | `1` | `1`, `2` |
| `CELERY_BROKER_URL` | URL complète du broker | Construite automatiquement | `redis://:pass@host:6379/0` |
| `CELERY_RESULT_BACKEND` | URL complète du backend | Construite automatiquement | `redis://:pass@host:6379/1` |

## Notes importantes

1. **Sécurité :** Ne commitez JAMAIS le fichier `.env` avec les mots de passe dans le contrôle de version.

2. **Priorité :** Si `CELERY_BROKER_URL` ou `CELERY_RESULT_BACKEND` sont définis, ils sont utilisés en priorité. Sinon, les URLs sont construites à partir des variables individuelles.

3. **Logs :** Les mots de passe ne sont jamais affichés dans les logs pour des raisons de sécurité.




