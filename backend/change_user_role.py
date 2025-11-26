"""
Script pour changer le rôle d'un utilisateur
"""
import sys
import os

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User, UserRole

def change_user_role():
    """Change le rôle d'un utilisateur"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("CHANGEMENT DE RÔLE UTILISATEUR")
        print("=" * 60)
        
        # 1. Trouver l'utilisateur
        target_email = "lalasonnael@gmail.com"
        user = User.query.filter_by(email=target_email).first()
        
        if not user:
            print(f"❌ Utilisateur '{target_email}' non trouvé")
            return
        
        print(f"\n✅ Utilisateur trouvé:")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Nom: {user.name}")
        print(f"   Rôle actuel: {user.role}")
        
        # 2. Changer le rôle en ENSEIGNANT
        old_role = user.role
        user.role = UserRole.ENSEIGNANT
        
        try:
            db.session.commit()
            print(f"\n✅ Rôle changé avec succès!")
            print(f"   Ancien rôle: {old_role}")
            print(f"   Nouveau rôle: {user.role}")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Erreur lors du changement de rôle: {e}")
            return
        
        # 3. Vérification finale
        user_after = User.query.filter_by(email=target_email).first()
        print(f"\n📋 Vérification finale:")
        print(f"   Rôle confirmé: {user_after.role}")

if __name__ == '__main__':
    change_user_role()







