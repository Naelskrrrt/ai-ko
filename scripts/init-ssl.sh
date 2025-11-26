#!/bin/bash
# Script d'initialisation SSL avec Let's Encrypt
# Usage: ./scripts/init-ssl.sh <domain> <email>

set -e

DOMAIN=${1:-}
EMAIL=${2:-}

if [ -z "$DOMAIN" ]; then
    echo "❌ Erreur: Domaine requis"
    echo "Usage: ./scripts/init-ssl.sh <domain> <email>"
    echo "Exemple: ./scripts/init-ssl.sh example.com admin@example.com"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    echo "❌ Erreur: Email requis"
    echo "Usage: ./scripts/init-ssl.sh <domain> <email>"
    exit 1
fi

echo "🔐 Initialisation SSL pour $DOMAIN"
echo "📧 Email: $EMAIL"
echo ""

# Créer les dossiers nécessaires
mkdir -p nginx/ssl
mkdir -p nginx/certbot-www

# Vérifier si les certificats existent déjà
if [ -f "nginx/ssl/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ Certificats SSL déjà présents pour $DOMAIN"
    echo "📝 Pour renouveler, utilisez: docker-compose run --rm certbot renew"
    exit 0
fi

# Créer une configuration Nginx temporaire pour le challenge
cat > nginx/nginx-temp.conf <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

# Démarrer Nginx temporairement pour le challenge
echo "🚀 Démarrage Nginx temporaire pour le challenge..."
docker run --rm -d \
    --name nginx-temp \
    -p 80:80 \
    -v "$(pwd)/nginx/nginx-temp.conf:/etc/nginx/conf.d/default.conf:ro" \
    -v "$(pwd)/nginx/certbot-www:/var/www/certbot:ro" \
    nginx:alpine

sleep 2

# Obtenir les certificats
echo "📜 Obtention des certificats Let's Encrypt..."
docker run --rm \
    -v "$(pwd)/nginx/ssl:/etc/letsencrypt" \
    -v "$(pwd)/nginx/certbot-www:/var/www/certbot" \
    certbot/certbot:latest \
    certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN"

# Arrêter Nginx temporaire
echo "🛑 Arrêt de Nginx temporaire..."
docker stop nginx-temp

# Créer les liens symboliques pour Nginx
echo "🔗 Création des liens symboliques..."
mkdir -p nginx/ssl/certs
ln -sf "../live/$DOMAIN/fullchain.pem" "nginx/ssl/certs/cert.pem" 2>/dev/null || true
ln -sf "../live/$DOMAIN/privkey.pem" "nginx/ssl/certs/key.pem" 2>/dev/null || true

# Copier les certificats au format attendu par Nginx
if [ -f "nginx/ssl/live/$DOMAIN/fullchain.pem" ]; then
    cp "nginx/ssl/live/$DOMAIN/fullchain.pem" "nginx/ssl/cert.pem"
    cp "nginx/ssl/live/$DOMAIN/privkey.pem" "nginx/ssl/key.pem"
    echo "✅ Certificats copiés vers nginx/ssl/"
else
    echo "⚠️  Les certificats n'ont pas été trouvés dans le format attendu"
    echo "📝 Vérifiez que les certificats sont dans nginx/ssl/live/$DOMAIN/"
fi

# Nettoyer
rm -f nginx/nginx-temp.conf

echo ""
echo "✅ Initialisation SSL terminée!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifiez que nginx/ssl/cert.pem et nginx/ssl/key.pem existent"
echo "  2. Démarrez les services: docker-compose up -d"
echo "  3. Les certificats seront renouvelés automatiquement via Certbot"
echo ""

