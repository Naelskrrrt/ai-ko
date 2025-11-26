"""
Script pour créer des données de test pour le modèle éducatif complet
"""
import os
import sys
from datetime import datetime, timedelta

# Ajouter le répertoire parent au path pour importer app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import (
    User, UserRole,
    Niveau, Matiere, Classe,
    QCM, Question,
    SessionExamen, Resultat
)
import bcrypt


def create_niveaux():
    """Créer les niveaux universitaires"""
    niveaux_data = [
        {'code': 'L1', 'nom': 'Licence 1', 'cycle': 'licence', 'ordre': 1},
        {'code': 'L2', 'nom': 'Licence 2', 'cycle': 'licence', 'ordre': 2},
        {'code': 'L3', 'nom': 'Licence 3', 'cycle': 'licence', 'ordre': 3},
        {'code': 'M1', 'nom': 'Master 1', 'cycle': 'master', 'ordre': 4},
        {'code': 'M2', 'nom': 'Master 2', 'cycle': 'master', 'ordre': 5},
        {'code': 'DOC', 'nom': 'Doctorat', 'cycle': 'doctorat', 'ordre': 6},
    ]

    niveaux = []
    for data in niveaux_data:
        niveau = Niveau.query.filter_by(code=data['code']).first()
        if not niveau:
            niveau = Niveau(
                code=data['code'],
                nom=data['nom'],
                description=f"Niveau {data['nom']} - Cycle {data['cycle']}",
                cycle=data['cycle'],
                ordre=data['ordre'],
                actif=True
            )
            db.session.add(niveau)
            print(f"✅ Niveau créé: {niveau.nom}")
        else:
            print(f"⏭️  Niveau existe déjà: {niveau.nom}")
        niveaux.append(niveau)

    db.session.commit()
    return {n.code: n for n in niveaux}


def create_matieres():
    """Créer les matières"""
    matieres_data = [
        {'code': 'MATH101', 'nom': 'Mathématiques Générales', 'coefficient': 3.0, 'couleur': '#3B82F6', 'icone': 'calculator'},
        {'code': 'INFO101', 'nom': 'Informatique Fondamentale', 'coefficient': 3.0, 'couleur': '#10B981', 'icone': 'code'},
        {'code': 'PHYS101', 'nom': 'Physique', 'coefficient': 2.5, 'couleur': '#8B5CF6', 'icone': 'atom'},
        {'code': 'ALGO201', 'nom': 'Algorithmique Avancée', 'coefficient': 3.5, 'couleur': '#F59E0B', 'icone': 'tree'},
        {'code': 'BDD201', 'nom': 'Bases de Données', 'coefficient': 3.0, 'couleur': '#EF4444', 'icone': 'database'},
        {'code': 'STAT201', 'nom': 'Statistiques', 'coefficient': 2.0, 'couleur': '#06B6D4', 'icone': 'chart-bar'},
        {'code': 'IA301', 'nom': 'Intelligence Artificielle', 'coefficient': 4.0, 'couleur': '#EC4899', 'icone': 'brain'},
        {'code': 'WEB301', 'nom': 'Développement Web', 'coefficient': 3.0, 'couleur': '#14B8A6', 'icone': 'globe'},
    ]

    matieres = []
    for data in matieres_data:
        matiere = Matiere.query.filter_by(code=data['code']).first()
        if not matiere:
            matiere = Matiere(
                code=data['code'],
                nom=data['nom'],
                description=f"Cours de {data['nom']}",
                coefficient=data['coefficient'],
                couleur=data['couleur'],
                icone=data['icone'],
                actif=True
            )
            db.session.add(matiere)
            print(f"✅ Matière créée: {matiere.nom}")
        else:
            print(f"⏭️  Matière existe déjà: {matiere.nom}")
        matieres.append(matiere)

    db.session.commit()
    return {m.code: m for m in matieres}


def create_classes(niveaux):
    """Créer des classes"""
    annee_actuelle = "2024-2025"

    classes_data = [
        {'code': 'L1-INFO-A', 'nom': 'Licence 1 Informatique Groupe A', 'niveau': 'L1', 'semestre': 1, 'effectif_max': 30},
        {'code': 'L1-INFO-B', 'nom': 'Licence 1 Informatique Groupe B', 'niveau': 'L1', 'semestre': 1, 'effectif_max': 30},
        {'code': 'L2-INFO-A', 'nom': 'Licence 2 Informatique Groupe A', 'niveau': 'L2', 'semestre': 1, 'effectif_max': 25},
        {'code': 'L3-INFO-A', 'nom': 'Licence 3 Informatique Groupe A', 'niveau': 'L3', 'semestre': 1, 'effectif_max': 25},
        {'code': 'M1-IA-A', 'nom': 'Master 1 Intelligence Artificielle', 'niveau': 'M1', 'semestre': 1, 'effectif_max': 20},
        {'code': 'M2-IA-A', 'nom': 'Master 2 Intelligence Artificielle', 'niveau': 'M2', 'semestre': 1, 'effectif_max': 15},
    ]

    classes = []
    for data in classes_data:
        classe = Classe.query.filter_by(code=data['code']).first()
        if not classe:
            classe = Classe(
                code=data['code'],
                nom=data['nom'],
                description=f"Classe {data['nom']} - Année {annee_actuelle}",
                niveau_id=niveaux[data['niveau']].id,
                annee_scolaire=annee_actuelle,
                semestre=data['semestre'],
                effectif_max=data['effectif_max'],
                actif=True
            )
            db.session.add(classe)
            print(f"✅ Classe créée: {classe.nom}")
        else:
            print(f"⏭️  Classe existe déjà: {classe.nom}")
        classes.append(classe)

    db.session.commit()
    return {c.code: c for c in classes}


def create_professeurs(matieres, niveaux, classes):
    """Créer des professeurs"""
    profs_data = [
        {
            'name': 'Prof. Martin Dupont',
            'email': 'prof.martin@university.edu',
            'numero': 'PROF001',
            'matieres': ['MATH101', 'STAT201'],
            'niveaux': ['L1', 'L2', 'L3'],
            'classes': ['L1-INFO-A', 'L2-INFO-A']
        },
        {
            'name': 'Prof. Sophie Bernard',
            'email': 'prof.sophie@university.edu',
            'numero': 'PROF002',
            'matieres': ['INFO101', 'ALGO201', 'BDD201'],
            'niveaux': ['L1', 'L2', 'L3'],
            'classes': ['L1-INFO-B', 'L3-INFO-A']
        },
        {
            'name': 'Prof. Jean Moreau',
            'email': 'prof.jean@university.edu',
            'numero': 'PROF003',
            'matieres': ['IA301', 'WEB301'],
            'niveaux': ['M1', 'M2'],
            'classes': ['M1-IA-A', 'M2-IA-A']
        },
    ]

    professeurs = []
    for data in profs_data:
        prof = User.query.filter_by(email=data['email']).first()
        if not prof:
            password = 'prof123'
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

            prof = User(
                name=data['name'],
                email=data['email'],
                password_hash=hashed.decode('utf-8'),
                role=UserRole.ENSEIGNANT,
                numero_enseignant=data['numero'],
                email_verified=True,
                telephone='+33 6 12 34 56 78'
            )
            db.session.add(prof)
            db.session.flush()  # Pour obtenir l'ID

            # Affecter les matières
            for matiere_code in data['matieres']:
                if matiere_code in matieres:
                    prof.matieres_enseignees.append(matieres[matiere_code])

            # Affecter les niveaux
            for niveau_code in data['niveaux']:
                if niveau_code in niveaux:
                    prof.niveaux_enseignes.append(niveaux[niveau_code])

            # Affecter les classes
            for classe_code in data['classes']:
                if classe_code in classes:
                    prof.classes_enseignees.append(classes[classe_code])

            print(f"✅ Professeur créé: {prof.name} ({prof.email}) - Mot de passe: {password}")
        else:
            print(f"⏭️  Professeur existe déjà: {prof.name}")
        professeurs.append(prof)

    db.session.commit()
    return professeurs


def create_etudiants(niveaux, classes):
    """Créer des étudiants"""
    etudiants_data = [
        {'name': 'Alice Martin', 'email': 'alice.martin@student.edu', 'numero': 'ETU20240001', 'niveau': 'L1', 'classe': 'L1-INFO-A'},
        {'name': 'Bob Durand', 'email': 'bob.durand@student.edu', 'numero': 'ETU20240002', 'niveau': 'L1', 'classe': 'L1-INFO-A'},
        {'name': 'Charlie Petit', 'email': 'charlie.petit@student.edu', 'numero': 'ETU20240003', 'niveau': 'L1', 'classe': 'L1-INFO-B'},
        {'name': 'David Rousseau', 'email': 'david.rousseau@student.edu', 'numero': 'ETU20240004', 'niveau': 'L2', 'classe': 'L2-INFO-A'},
        {'name': 'Emma Leroy', 'email': 'emma.leroy@student.edu', 'numero': 'ETU20240005', 'niveau': 'L3', 'classe': 'L3-INFO-A'},
        {'name': 'Franck Simon', 'email': 'franck.simon@student.edu', 'numero': 'ETU20240006', 'niveau': 'M1', 'classe': 'M1-IA-A'},
        {'name': 'Grace Laurent', 'email': 'grace.laurent@student.edu', 'numero': 'ETU20240007', 'niveau': 'M2', 'classe': 'M2-IA-A'},
    ]

    etudiants = []
    for data in etudiants_data:
        etudiant = User.query.filter_by(email=data['email']).first()
        if not etudiant:
            password = 'etu123'
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

            etudiant = User(
                name=data['name'],
                email=data['email'],
                password_hash=hashed.decode('utf-8'),
                role=UserRole.ETUDIANT,
                numero_etudiant=data['numero'],
                email_verified=True
            )
            db.session.add(etudiant)
            db.session.flush()

            # Affecter le niveau
            if data['niveau'] in niveaux:
                etudiant.niveaux_etudiants.append(niveaux[data['niveau']])

            # Affecter la classe
            if data['classe'] in classes:
                etudiant.classes_etudiants.append(classes[data['classe']])

            print(f"✅ Étudiant créé: {etudiant.name} ({etudiant.email}) - Mot de passe: {password}")
        else:
            print(f"⏭️  Étudiant existe déjà: {etudiant.name}")
        etudiants.append(etudiant)

    db.session.commit()
    return etudiants


def main():
    """Fonction principale"""
    print("\n🎓 Création des données éducatives pour AI-KO\n")
    print("=" * 60)

    app = create_app()

    with app.app_context():
        # Créer les niveaux
        print("\n📚 Création des niveaux...")
        niveaux = create_niveaux()

        # Créer les matières
        print("\n📖 Création des matières...")
        matieres = create_matieres()

        # Créer les classes
        print("\n🏫 Création des classes...")
        classes = create_classes(niveaux)

        # Créer les professeurs
        print("\n👨‍🏫 Création des professeurs...")
        professeurs = create_professeurs(matieres, niveaux, classes)

        # Créer les étudiants
        print("\n👨‍🎓 Création des étudiants...")
        etudiants = create_etudiants(niveaux, classes)

        print("\n" + "=" * 60)
        print("✅ Données éducatives créées avec succès!")
        print("\n📊 Résumé:")
        print(f"   - {len(niveaux)} niveaux")
        print(f"   - {len(matieres)} matières")
        print(f"   - {len(classes)} classes")
        print(f"   - {len(professeurs)} professeurs")
        print(f"   - {len(etudiants)} étudiants")

        print("\n🔑 Identifiants de connexion:")
        print("\n   Professeurs:")
        print("   - prof.martin@university.edu / prof123")
        print("   - prof.sophie@university.edu / prof123")
        print("   - prof.jean@university.edu / prof123")

        print("\n   Étudiants:")
        print("   - alice.martin@student.edu / etu123")
        print("   - bob.durand@student.edu / etu123")
        print("   - charlie.petit@student.edu / etu123")
        print("   - ... (voir au-dessus)")

        print("\n" + "=" * 60)


if __name__ == '__main__':
    main()
