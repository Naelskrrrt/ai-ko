"""
Script pour ajouter la matière Algorithmique à l'étudiant de test
"""
from app import create_app, db
from app.models.user import User
from app.models.matiere import Matiere

def add_matiere_to_student():
    app = create_app()
    with app.app_context():
        # Récupérer l'étudiant
        user = User.query.filter_by(id='daea87c3-1167-4deb-bb99-f1da1321aca4').first()
        if not user or not user.etudiant_profil:
            print("Etudiant non trouve")
            return
        
        etudiant = user.etudiant_profil
        print(f"Etudiant: {user.name} (ID: {etudiant.id})")
        
        # Récupérer la matière Algorithmique
        matiere_algo = Matiere.query.filter_by(id='40c1e24a-c282-4b5e-9fd0-97ce86b713a3').first()
        if not matiere_algo:
            print("Matiere Algorithmique non trouvee")
            return
        
        print(f"Matiere: {matiere_algo.nom} ({matiere_algo.code})")
        
        # Vérifier si l'étudiant a déjà cette matière
        has_matiere = matiere_algo.id in [m.id for m in etudiant.matieres.all()]
        print(f"Etudiant a deja cette matiere: {has_matiere}")
        
        if not has_matiere:
            db.session.execute(
                db.text("INSERT INTO etudiant_matieres_v2 (etudiant_id, matiere_id, annee_scolaire) VALUES (:etudiant_id, :matiere_id, :annee_scolaire)"),
                {"etudiant_id": etudiant.id, "matiere_id": matiere_algo.id, "annee_scolaire": "2024-2025"}
            )
            db.session.commit()
            print("Matiere ajoutee a l'etudiant!")
        else:
            print("L'etudiant a deja cette matiere")
        
        # Afficher toutes les matières de l'étudiant
        matieres = list(etudiant.matieres.filter(Matiere.actif == True).all())
        print(f"\nMatieres de l'etudiant ({len(matieres)}):")
        for m in matieres:
            print(f"  - {m.nom} ({m.code})")

if __name__ == '__main__':
    add_matiere_to_student()

