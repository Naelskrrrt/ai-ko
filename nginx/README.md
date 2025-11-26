# Configuration Nginx

## Fichiers

- **`nginx.conf`** : Configuration principale (HTTP + HTTPS si certificats présents)
- **`nginx.conf.dev`** : Configuration développement (HTTP uniquement)

## Utilisation

### Mode Développement (HTTP uniquement)

Pour utiliser uniquement HTTP (sans SSL), vous pouvez utiliser `nginx.conf.dev` :

```bash
# Dans docker-compose.yml, modifier le volume nginx:
volumes:
  - ./nginx/nginx.conf.dev:/etc/nginx/nginx.conf:ro
```

### Mode Production (HTTPS)

1. **Générer les certificats SSL** :
   ```bash
   ./scripts/init-ssl.sh votre-domaine.com admin@votre-domaine.com
   ```

2. **Activer la redirection HTTPS** :
   Dans `nginx.conf`, décommentez la section de redirection dans le serveur HTTP (port 80) :
   ```nginx
   location / {
       return 301 https://$host$request_uri;
   }
   ```
   Et commentez la section proxy_pass HTTP.

3. **Redémarrer Nginx** :
   ```bash
   docker-compose restart nginx
   ```

## Structure des Certificats

Les certificats doivent être placés dans `nginx/ssl/` :
- `cert.pem` : Certificat SSL
- `key.pem` : Clé privée SSL

Après génération avec `init-ssl.sh`, les certificats Let's Encrypt sont dans :
- `nginx/ssl/live/votre-domaine.com/fullchain.pem`
- `nginx/ssl/live/votre-domaine.com/privkey.pem`

Le script `init-ssl.sh` copie automatiquement ces fichiers vers `cert.pem` et `key.pem`.

## Renouvellement des Certificats

Les certificats Let's Encrypt sont renouvelés automatiquement par le service Certbot dans `docker-compose.yml`.

Pour forcer un renouvellement :
```bash
docker-compose run --rm certbot renew --force-renewal
```

## Dépannage

### Nginx ne démarre pas

Vérifiez les logs :
```bash
docker-compose logs nginx
```

### Erreur "SSL certificate not found"

Si vous utilisez HTTPS mais que les certificats n'existent pas :
1. Générez-les avec `init-ssl.sh`
2. Ou utilisez `nginx.conf.dev` pour le développement

### Tester la configuration

```bash
docker-compose exec nginx nginx -t
```

