"""
Script pour créer des utilisateurs de test (admin, enseignants, étudiants)
"""
from app import create_app, db
from app.models.user import User, UserRole

def create_test_users():
    """Crée des utilisateurs de test"""
    app = create_app()
    
    with app.app_context():
        users_to_create = [
            # Admin
            {
                "email": "admin@test.com",
                "name": "Administrateur Test",
                "role": UserRole.ADMIN,
                "password": "admin123"
            },
            # Enseignants
            {
                "email": "prof1@test.com",
                "name": "Professeur Martin",
                "role": UserRole.ENSEIGNANT,
                "password": "prof123"
            },
            {
                "email": "prof2@test.com",
                "name": "Professeur Dubois",
                "role": UserRole.ENSEIGNANT,
                "password": "prof123"
            },
            # Étudiants
            {
                "email": "etudiant1@test.com",
                "name": "Marie Dupont",
                "role": UserRole.ETUDIANT,
                "password": "etudiant123"
            },
            {
                "email": "etudiant2@test.com",
                "name": "Pierre Bernard",
                "role": UserRole.ETUDIANT,
                "password": "etudiant123"
            },
            {
                "email": "etudiant3@test.com",
                "name": "Sophie Laurent",
                "role": UserRole.ETUDIANT,
                "password": "etudiant123"
            },
        ]
        
        created_count = 0
        skipped_count = 0
        
        print("Création des utilisateurs de test...")
        print("-" * 60)
        
        for user_data in users_to_create:
            # Vérifier si l'utilisateur existe déjà
            existing_user = User.query.filter_by(email=user_data["email"]).first()
            if existing_user:
                print(f"⊘ {user_data['email']} existe déjà (ignoré)")
                skipped_count += 1
                continue
            
            # Créer l'utilisateur
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                role=user_data["role"],
                email_verified=True
            )
            user.set_password(user_data["password"])
            
            db.session.add(user)
            created_count += 1
            print(f"✓ {user_data['name']} ({user_data['role'].value}) créé")
        
        db.session.commit()
        
        print("-" * 60)
        print(f"✓ {created_count} utilisateur(s) créé(s)")
        print(f"⊘ {skipped_count} utilisateur(s) ignoré(s) (déjà existants)")
        print()
        print("Comptes de test créés:")
        print("  Admin:")
        print("    - Email: admin@test.com | Mot de passe: admin123")
        print("  Enseignants:")
        print("    - Email: prof1@test.com | Mot de passe: prof123")
        print("    - Email: prof2@test.com | Mot de passe: prof123")
        print("  Étudiants:")
        print("    - Email: etudiant1@test.com | Mot de passe: etudiant123")
        print("    - Email: etudiant2@test.com | Mot de passe: etudiant123")
        print("    - Email: etudiant3@test.com | Mot de passe: etudiant123")
        print()
        print("Connexion: http://localhost:3000/login")
        print("Admin: http://localhost:3000/admin")

if __name__ == "__main__":
    create_test_users()


