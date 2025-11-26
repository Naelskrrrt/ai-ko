"""
Script pour créer des données de test pour l'utilisateur lalasonnael@gmail.com
"""
import bcrypt
from app.models import (
    User, UserRole,
    Niveau, Matiere, Classe,
    QCM, Question,
    SessionExamen, Resultat
)
from app import create_app, db
import os
import sys
from datetime import datetime, timedelta, timezone
import json

# Ajouter le répertoire parent au path pour importer app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def get_or_create_user():
    """Trouve ou crée l'utilisateur lalasonnael@gmail.com"""
    email = "lalasonnael@gmail.com"
    user = User.query.filter_by(email=email).first()

    if not user:
        password = "test123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        user = User(
            name="Lala Sonnael",
            email=email,
            password_hash=hashed.decode('utf-8'),
            role=UserRole.ETUDIANT,
            numero_etudiant="ETU20240099",
            email_verified=True
        )
        db.session.add(user)
        db.session.commit()
        print(
            f"✅ Utilisateur créé: {user.name} ({user.email}) - Mot de passe: {password}")
    else:
        print(f"⏭️  Utilisateur existe déjà: {user.name} ({user.email})")

    return user


def get_or_create_niveaux_matieres():
    """Récupère ou crée les niveaux et matières de base"""
    # Niveau L1
    niveau_l1 = Niveau.query.filter_by(code='L1').first()
    if not niveau_l1:
        niveau_l1 = Niveau(
            code='L1',
            nom='Licence 1',
            description='Licence 1 Informatique',
            cycle='licence',
            ordre=1,
            actif=True
        )
        db.session.add(niveau_l1)
        db.session.commit()

    # Matière Informatique
    matiere_info = Matiere.query.filter_by(code='INFO101').first()
    if not matiere_info:
        matiere_info = Matiere(
            code='INFO101',
            nom='Informatique Fondamentale',
            description='Cours d\'informatique fondamentale',
            coefficient=3.0,
            couleur='#10B981',
            icone='code',
            actif=True
        )
        db.session.add(matiere_info)
        db.session.commit()

    return niveau_l1, matiere_info


def get_or_create_enseignant():
    """Trouve ou crée un enseignant pour créer les QCM"""
    email = "prof.test@university.edu"
    prof = User.query.filter_by(email=email).first()

    if not prof:
        password = "prof123"
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        prof = User(
            name="Professeur Test",
            email=email,
            password_hash=hashed.decode('utf-8'),
            role=UserRole.ENSEIGNANT,
            numero_enseignant="PROF999",
            email_verified=True
        )
        db.session.add(prof)
        db.session.commit()
        print(f"✅ Enseignant créé: {prof.name} ({prof.email})")
    else:
        print(f"⏭️  Enseignant existe déjà: {prof.name}")

    return prof


def create_qcm_with_questions(enseignant, matiere, titre, description, questions_data):
    """Crée un QCM avec ses questions"""
    # Vérifier si le QCM existe déjà
    qcm = QCM.query.filter_by(titre=titre, createur_id=enseignant.id).first()

    if qcm:
        print(f"⏭️  QCM existe déjà: {titre}")
        return qcm

    qcm = QCM(
        titre=titre,
        description=description,
        duree=60,
        matiere=matiere.nom,
        status='published',
        createur_id=enseignant.id
    )
    db.session.add(qcm)
    db.session.flush()

    # Créer les questions
    for idx, q_data in enumerate(questions_data):
        question = Question(
            enonce=q_data['enonce'],
            type_question=q_data['type'],
            points=q_data['points'],
            qcm_id=qcm.id,
            explication=q_data.get('explication')
        )

        if q_data['type'] == 'qcm':
            # Options pour QCM
            options = q_data['options']
            question.set_options(options)
        elif q_data['type'] == 'vrai_faux':
            question.reponse_correcte = q_data['reponse_correcte']

        db.session.add(question)

    db.session.commit()
    print(f"✅ QCM créé: {titre} avec {len(questions_data)} questions")
    return qcm


def create_session(enseignant, qcm, titre, date_debut, date_fin, status='programmee', classe=None):
    """Crée une session d'examen"""
    # Vérifier si la session existe déjà
    session = SessionExamen.query.filter_by(titre=titre, qcm_id=qcm.id).first()

    if session:
        print(f"⏭️  Session existe déjà: {titre}")
        return session

    session = SessionExamen(
        titre=titre,
        description=f"Session d'examen pour {qcm.titre}",
        date_debut=date_debut,
        date_fin=date_fin,
        duree_minutes=60,
        tentatives_max=3,
        melange_questions=True,
        melange_options=True,
        afficher_correction=True,
        note_passage=10.0,
        status=status,
        qcm_id=qcm.id,
        classe_id=classe.id if classe else None,
        createur_id=enseignant.id
    )
    db.session.add(session)
    db.session.commit()
    print(f"✅ Session créée: {titre} ({status})")
    return session


def create_resultat(etudiant, session, status='termine', note_sur_20=None, pourcentage=None):
    """Crée un résultat pour l'étudiant"""
    # Vérifier si le résultat existe déjà
    resultat = Resultat.query.filter_by(
        etudiant_id=etudiant.id,
        session_id=session.id
    ).first()

    if resultat:
        print(f"⏭️  Résultat existe déjà pour {session.titre}")
        return resultat

    # Compter les tentatives
    nb_tentatives = Resultat.query.filter_by(
        etudiant_id=etudiant.id,
        session_id=session.id
    ).count()

    # Récupérer le QCM pour calculer le score maximum
    qcm = session.qcm
    questions = qcm.questions if qcm else []
    score_maximum = sum([q.points for q in questions]) if questions else 20

    now = datetime.now(timezone.utc)
    date_debut = now - timedelta(hours=1)
    date_fin = now if status == 'termine' else None

    resultat = Resultat(
        etudiant_id=etudiant.id,
        session_id=session.id,
        qcm_id=session.qcm_id,
        numero_tentative=nb_tentatives + 1,
        date_debut=date_debut,
        date_fin=date_fin,
        duree_reelle_secondes=3600 if status == 'termine' else None,
        score_total=note_sur_20 if note_sur_20 else 0,
        score_maximum=score_maximum,
        note_sur_20=note_sur_20,
        pourcentage=pourcentage or (note_sur_20 * 5 if note_sur_20 else 0),
        questions_total=len(questions),
        questions_repondues=len(questions) if status == 'termine' else 0,
        questions_correctes=int(len(
            questions) * (pourcentage / 100)) if pourcentage and status == 'termine' else 0,
        questions_incorrectes=len(questions) - int(len(questions) * (
            pourcentage / 100)) if pourcentage and status == 'termine' else 0,
        status=status,
        est_reussi=(note_sur_20 >=
                    session.note_passage) if note_sur_20 else False,
        est_valide=True,
        feedback_auto=f"Examen {'réussi' if note_sur_20 and note_sur_20 >= session.note_passage else 'échoué'}" if status == 'termine' else None
    )

    db.session.add(resultat)
    db.session.commit()
    print(
        f"✅ Résultat créé pour {session.titre}: {note_sur_20}/20 ({pourcentage}%)" if note_sur_20 else f"✅ Résultat créé pour {session.titre}: {status}")
    return resultat


def main():
    """Fonction principale"""
    print("\n🎓 Création des données de test pour lalasonnael@gmail.com\n")
    print("=" * 60)

    app = create_app()

    with app.app_context():
        # Créer les tables si elles n'existent pas
        try:
            db.create_all()
            print("✅ Tables de base de données vérifiées/créées")
        except Exception as e:
            print(f"⚠️  Erreur lors de la création des tables: {e}")
            print("   Les tables existent peut-être déjà.")
        # 1. Créer ou récupérer l'utilisateur
        print("\n👤 Création/récupération de l'utilisateur...")
        etudiant = get_or_create_user()

        # 2. Créer ou récupérer niveaux et matières
        print("\n📚 Création/récupération des niveaux et matières...")
        niveau_l1, matiere_info = get_or_create_niveaux_matieres()

        # 3. Créer ou récupérer un enseignant
        print("\n👨‍🏫 Création/récupération d'un enseignant...")
        enseignant = get_or_create_enseignant()

        # 4. Créer des QCM avec questions
        print("\n📝 Création des QCM...")

        # QCM 1: Algorithmique
        qcm1_questions = [
            {
                'enonce': 'Qu\'est-ce qu\'un algorithme?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'Une séquence d\'instructions pour résoudre un problème',
                        'estCorrecte': True},
                    {'id': 'b', 'texte': 'Un langage de programmation',
                        'estCorrecte': False},
                    {'id': 'c', 'texte': 'Un type de données', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'Une fonction mathématique',
                        'estCorrecte': False}
                ],
                'explication': 'Un algorithme est une séquence d\'instructions logiques pour résoudre un problème.'
            },
            {
                'enonce': 'Quelle est la complexité temporelle de la recherche linéaire?',
                'type': 'qcm',
                'points': 3,
                'options': [
                    {'id': 'a', 'texte': 'O(1)', 'estCorrecte': False},
                    {'id': 'b', 'texte': 'O(log n)', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'O(n)', 'estCorrecte': True},
                    {'id': 'd', 'texte': 'O(n²)', 'estCorrecte': False}
                ],
                'explication': 'La recherche linéaire parcourt tous les éléments, donc O(n).'
            },
            {
                'enonce': 'Python est un langage compilé.',
                'type': 'vrai_faux',
                'points': 1,
                'reponse_correcte': 'Faux',
                'explication': 'Python est un langage interprété, pas compilé.'
            }
        ]

        qcm1 = create_qcm_with_questions(
            enseignant,
            matiere_info,
            "QCM Algorithmique - Bases",
            "QCM sur les bases de l'algorithmique et de la complexité",
            qcm1_questions
        )

        # QCM 2: Bases de données
        qcm2_questions = [
            {
                'enonce': 'Qu\'est-ce qu\'une clé primaire?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'Une colonne qui identifie de manière unique chaque ligne',
                        'estCorrecte': True},
                    {'id': 'b', 'texte': 'Une colonne qui peut être NULL',
                        'estCorrecte': False},
                    {'id': 'c', 'texte': 'Une colonne qui contient des dates',
                        'estCorrecte': False},
                    {'id': 'd', 'texte': 'Une colonne qui peut être dupliquée',
                        'estCorrecte': False}
                ],
                'explication': 'Une clé primaire identifie de manière unique chaque enregistrement.'
            },
            {
                'enonce': 'SQL signifie Structured Query Language.',
                'type': 'vrai_faux',
                'points': 1,
                'reponse_correcte': 'Vrai',
                'explication': 'SQL est bien l\'acronyme de Structured Query Language.'
            }
        ]

        qcm2 = create_qcm_with_questions(
            enseignant,
            matiere_info,
            "QCM Bases de Données",
            "QCM sur les concepts fondamentaux des bases de données",
            qcm2_questions
        )

        # QCM 3: Programmation Python
        qcm3_questions = [
            {
                'enonce': 'Quelle est la syntaxe correcte pour créer une liste en Python?',
                'type': 'qcm',
                'points': 2,
                'options': [
                    {'id': 'a', 'texte': 'list = []', 'estCorrecte': True},
                    {'id': 'b', 'texte': 'list = {}', 'estCorrecte': False},
                    {'id': 'c', 'texte': 'list = ()', 'estCorrecte': False},
                    {'id': 'd', 'texte': 'list = <>', 'estCorrecte': False}
                ],
                'explication': 'Les listes Python utilisent des crochets [].'
            },
            {
                'enonce': 'Les dictionnaires Python sont mutables.',
                'type': 'vrai_faux',
                'points': 1,
                'reponse_correcte': 'Vrai',
                'explication': 'Les dictionnaires Python peuvent être modifiés après leur création.'
            }
        ]

        qcm3 = create_qcm_with_questions(
            enseignant,
            matiere_info,
            "QCM Programmation Python",
            "QCM sur les bases de la programmation Python",
            qcm3_questions
        )

        # 5. Créer des sessions d'examen
        print("\n📅 Création des sessions d'examen...")
        now = datetime.now(timezone.utc)

        # Session 1: Disponible (en cours)
        session1 = create_session(
            enseignant,
            qcm1,
            "Examen Algorithmique - Session 1",
            now - timedelta(hours=1),
            now + timedelta(hours=2),
            status='en_cours'
        )

        # Session 2: Disponible (programmée)
        session2 = create_session(
            enseignant,
            qcm2,
            "Examen Bases de Données - Session 1",
            now + timedelta(days=1),
            now + timedelta(days=1, hours=3),
            status='programmee'
        )

        # Session 3: Terminée
        session3 = create_session(
            enseignant,
            qcm3,
            "Examen Python - Session 1",
            now - timedelta(days=5),
            now - timedelta(days=5, hours=2),
            status='terminee'
        )

        # Session 4: Terminée (autre tentative)
        session4 = create_session(
            enseignant,
            qcm1,
            "Examen Algorithmique - Session 2",
            now - timedelta(days=3),
            now - timedelta(days=3, hours=2),
            status='terminee'
        )

        # 6. Créer des résultats
        print("\n📊 Création des résultats...")

        # Résultat 1: En cours (pour session1)
        resultat1 = create_resultat(
            etudiant,
            session1,
            status='en_cours'
        )

        # Résultat 2: Terminé avec bonne note (session3)
        resultat2 = create_resultat(
            etudiant,
            session3,
            status='termine',
            note_sur_20=16.5,
            pourcentage=82.5
        )

        # Résultat 3: Terminé avec note moyenne (session4)
        resultat3 = create_resultat(
            etudiant,
            session4,
            status='termine',
            note_sur_20=12.0,
            pourcentage=60.0
        )

        print("\n" + "=" * 60)
        print("✅ Données de test créées avec succès!")
        print("\n📊 Résumé pour lalasonnael@gmail.com:")
        print(
            f"   - {QCM.query.filter_by(createur_id=enseignant.id).count()} QCM créés")
        print(
            f"   - {SessionExamen.query.filter_by(createur_id=enseignant.id).count()} sessions créées")
        print(
            f"   - {Resultat.query.filter_by(etudiant_id=etudiant.id).count()} résultats créés")
        print("\n🔑 Connexion:")
        print(f"   - Email: lalasonnael@gmail.com")
        print(f"   - Mot de passe: test123")
        print("\n" + "=" * 60)


if __name__ == '__main__':
    main()
