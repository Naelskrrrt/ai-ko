#!/bin/bash
# Script d'initialisation complète de la base de données
# Usage: ./scripts/init-db-complete.sh [admin_email] [admin_password]

set -e

ADMIN_EMAIL=${1:-admin@ai-ko.local}
ADMIN_PASSWORD=${2:-admin123}
ADMIN_NAME=${3:-Administrateur}

echo "🗄️  Initialisation complète de la base de données"
echo "=========================================="
echo ""

# Vérifier que le backend est en cours d'exécution
if ! docker-compose ps backend | grep -q "Up"; then
    echo "❌ Le service backend n'est pas en cours d'exécution"
    echo "📝 Démarrez d'abord: docker-compose up -d backend"
    exit 1
fi

echo "📦 Étape 1: Exécution des migrations..."
docker-compose exec -T backend flask db upgrade || {
    echo "⚠️  Erreur lors des migrations, tentative de création des tables..."
    docker-compose exec -T backend python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"
}

echo ""
echo "🌱 Étape 2: Enrichissement des données (niveaux, matières)..."
if docker-compose exec -T backend test -f scripts/seed_niveaux_matieres.py; then
    docker-compose exec -T backend python scripts/seed_niveaux_matieres.py || echo "⚠️  Seed déjà effectué ou erreur"
else
    echo "⚠️  Script de seed non trouvé, ignoré"
fi

echo ""
echo "👤 Étape 3: Création de l'administrateur..."
docker-compose exec -T backend python -c "
from app import create_app, db
from app.models.user import User, UserRole

app = create_app()
with app.app_context():
    # Vérifier si l'admin existe déjà
    existing = User.query.filter_by(email='$ADMIN_EMAIL').first()
    if existing:
        print('⚠️  Un utilisateur avec cet email existe déjà')
        if existing.role == UserRole.ADMIN:
            print('✅ L\'administrateur existe déjà')
        else:
            existing.role = UserRole.ADMIN
            db.session.commit()
            print('✅ Rôle administrateur ajouté à l\'utilisateur existant')
    else:
        admin = User(
            email='$ADMIN_EMAIL',
            name='$ADMIN_NAME',
            role=UserRole.ADMIN,
            email_verified=True
        )
        admin.set_password('$ADMIN_PASSWORD')
        db.session.add(admin)
        db.session.commit()
        print('✅ Administrateur créé avec succès!')
        print(f'   Email: $ADMIN_EMAIL')
        print(f'   Nom: $ADMIN_NAME')
" || echo "⚠️  Erreur lors de la création de l'admin"

echo ""
echo "=========================================="
echo "✅ Initialisation terminée!"
echo ""
echo "📊 Informations de connexion:"
echo "   Email: $ADMIN_EMAIL"
echo "   Mot de passe: $ADMIN_PASSWORD"
echo ""
echo "🌐 Accès:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - Swagger: http://localhost:5000/api/docs/swagger/"
echo ""

