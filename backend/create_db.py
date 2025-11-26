"""
Script pour créer la base de données et appliquer les migrations
"""
from app import create_app, db
from app.models.user import User
from sqlalchemy import inspect

app = create_app()

with app.app_context():
    # Créer toutes les tables
    db.create_all()
    print("Base de données créée avec succès!")
    
    # Vérifier les tables créées
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"Tables créées: {tables}")
    
    # Vérifier si la table users existe
    if 'users' in tables:
        print("[OK] Table 'users' existe!")
        # Afficher les colonnes
        columns = inspector.get_columns('users')
        print(f"Colonnes: {[col['name'] for col in columns]}")
    else:
        print("[ERREUR] Table 'users' n'existe pas!")

