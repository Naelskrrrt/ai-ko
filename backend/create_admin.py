"""
Script pour créer un utilisateur administrateur
"""
from app import create_app, db
from app.models.user import User, UserRole

def create_admin(email, name, password):
    """Crée un utilisateur administrateur"""
    app = create_app()
    
    with app.app_context():
        # Vérifier si l'admin existe déjà
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            print(f"❌ Un utilisateur avec l'email {email} existe déjà")
            return False
        
        # Créer l'admin
        admin = User(
            email=email,
            name=name,
            role=UserRole.ADMIN,
            email_verified=True
        )
        admin.set_password(password)
        
        db.session.add(admin)
        db.session.commit()
        
        print(f"✓ Administrateur créé avec succès!")
        print(f"  Email: {email}")
        print(f"  Nom: {name}")
        print(f"  Rôle: {admin.role.value}")
        print(f"\nVous pouvez maintenant vous connecter sur http://localhost:3000/login")
        
        return True

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) == 4:
        email = sys.argv[1]
        name = sys.argv[2]
        password = sys.argv[3]
    else:
        print("Création d'un utilisateur administrateur")
        print("-" * 50)
        email = input("Email: ")
        name = input("Nom complet: ")
        password = input("Mot de passe: ")
    
    create_admin(email, name, password)


