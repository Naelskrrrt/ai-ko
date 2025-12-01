#!/bin/bash
# Script pour configurer les variables d'environnement sur Vercel

set -e

echo "🔧 Configuration des variables d'environnement sur Vercel..."

# Récupérer l'URL Vercel déployée
VERCEL_URL=$(vercel inspect --token $(vercel whoami --token 2>&1 | grep -o 'token.*' | cut -d' ' -f2) 2>&1 | grep -o 'https://[^[:space:]]*' | head -1)

echo "📍 URL Vercel détectée: $VERCEL_URL"

# Variables d'environnement à configurer
echo "📝 Ajout des variables d'environnement..."

# Backend URL interne (pour les appels côté serveur)
vercel env add BACKEND_INTERNAL_URL production <<EOF
http://147.93.90.223:5000
EOF

# API URL publique (pour les appels côté client)
vercel env add NEXT_PUBLIC_API_URL production <<EOF
http://147.93.90.223:5000
EOF

# NextAuth configuration
vercel env add NEXTAUTH_SECRET production <<EOF
J6kL9mN2oP5qR8sT1uV4wX7yZ0aB3cD6eF9gH2iJ5kL8mN1oP4qR7sT0u
EOF

vercel env add NEXTAUTH_URL production <<EOF
$VERCEL_URL
EOF

# Better Auth configuration
vercel env add BETTER_AUTH_SECRET production <<EOF
M3nO6pQ9rS2tU5vW8xY1zA4bC7dE0fG3hI6jK9lM2nO5pQ8rS1tU4vW7x
EOF

vercel env add BETTER_AUTH_URL production <<EOF
$VERCEL_URL
EOF

# Google OAuth
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "❌ Erreur: GOOGLE_CLIENT_ID n'est pas défini dans les variables d'environnement"
    exit 1
fi
vercel env add GOOGLE_CLIENT_ID production <<EOF
$GOOGLE_CLIENT_ID
EOF

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "❌ Erreur: GOOGLE_CLIENT_SECRET n'est pas défini dans les variables d'environnement"
    exit 1
fi
vercel env add GOOGLE_CLIENT_SECRET production <<EOF
$GOOGLE_CLIENT_SECRET
EOF

vercel env add GOOGLE_REDIRECT_URI production <<EOF
${VERCEL_URL}/api/auth/callback/google
EOF

echo "✅ Variables d'environnement configurées avec succès!"
echo "🔄 Redéploiement nécessaire pour appliquer les changements..."
echo ""
echo "Exécutez: vercel --prod"
