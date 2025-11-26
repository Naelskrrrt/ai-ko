"""
Script pour enrichir la base de données avec les niveaux et matières universitaires (Informatique)
"""
import sys
import os

# Ajouter le répertoire parent au path pour importer app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.niveau import Niveau
from app.models.matiere import Matiere
import uuid

def seed_niveaux():
    """Crée les niveaux universitaires"""
    print("\n📚 Création des niveaux universitaires...")

    niveaux_data = [
        # Licence
        {
            'code': 'L1',
            'nom': 'Licence 1',
            'description': 'Première année de Licence en Informatique',
            'ordre': 1,
            'cycle': 'licence'
        },
        {
            'code': 'L2',
            'nom': 'Licence 2',
            'description': 'Deuxième année de Licence en Informatique',
            'ordre': 2,
            'cycle': 'licence'
        },
        {
            'code': 'L3',
            'nom': 'Licence 3',
            'description': 'Troisième année de Licence en Informatique',
            'ordre': 3,
            'cycle': 'licence'
        },
        # Master
        {
            'code': 'M1',
            'nom': 'Master 1',
            'description': 'Première année de Master en Informatique',
            'ordre': 4,
            'cycle': 'master'
        },
        {
            'code': 'M2',
            'nom': 'Master 2',
            'description': 'Deuxième année de Master en Informatique (Spécialisation)',
            'ordre': 5,
            'cycle': 'master'
        },
        # Doctorat
        {
            'code': 'D',
            'nom': 'Doctorat',
            'description': 'Doctorat en Informatique (Recherche)',
            'ordre': 6,
            'cycle': 'doctorat'
        }
    ]

    created_count = 0
    for niveau_data in niveaux_data:
        # Vérifier si le niveau existe déjà
        existing = Niveau.query.filter_by(code=niveau_data['code']).first()
        if existing:
            print(f"  ⏭️  Niveau {niveau_data['code']} existe déjà")
            continue

        niveau = Niveau(
            id=str(uuid.uuid4()),
            **niveau_data,
            actif=True
        )
        db.session.add(niveau)
        created_count += 1
        print(f"  ✅ Niveau {niveau.code} - {niveau.nom} créé")

    db.session.commit()
    print(f"\n✅ {created_count} niveaux créés avec succès!")


def seed_matieres():
    """Crée les matières informatiques universitaires"""
    print("\n📖 Création des matières informatiques...")

    matieres_data = [
        # Programmation
        {
            'code': 'PROG101',
            'nom': 'Introduction à la Programmation',
            'description': 'Concepts de base de la programmation : variables, structures de contrôle, fonctions',
            'coefficient': 2.0,
            'couleur': '#3B82F6',
            'icone': 'code'
        },
        {
            'code': 'PROG201',
            'nom': 'Programmation Python',
            'description': 'Programmation en Python : syntaxe, structures de données, programmation orientée objet',
            'coefficient': 2.0,
            'couleur': '#3776AB',
            'icone': 'python'
        },
        {
            'code': 'PROG301',
            'nom': 'Programmation Java',
            'description': 'Programmation orientée objet en Java, collections, exceptions, threads',
            'coefficient': 2.0,
            'couleur': '#007396',
            'icone': 'java'
        },
        {
            'code': 'PROG401',
            'nom': 'Programmation C/C++',
            'description': 'Programmation système en C et C++, gestion de la mémoire, pointeurs',
            'coefficient': 2.0,
            'couleur': '#00599C',
            'icone': 'cplusplus'
        },

        # Algorithmique et Structures de Données
        {
            'code': 'ALGO101',
            'nom': 'Algorithmique Fondamentale',
            'description': 'Algorithmes de tri, recherche, complexité algorithmique',
            'coefficient': 2.5,
            'couleur': '#10B981',
            'icone': 'algorithm'
        },
        {
            'code': 'ALGO201',
            'nom': 'Structures de Données',
            'description': 'Listes, piles, files, arbres, graphes, tables de hachage',
            'coefficient': 2.5,
            'couleur': '#059669',
            'icone': 'tree'
        },
        {
            'code': 'ALGO301',
            'nom': 'Algorithmique Avancée',
            'description': 'Algorithmes de graphes, programmation dynamique, algorithmes gloutons',
            'coefficient': 3.0,
            'couleur': '#047857',
            'icone': 'graph'
        },

        # Bases de Données
        {
            'code': 'BDD101',
            'nom': 'Bases de Données Relationnelles',
            'description': 'Modélisation relationnelle, SQL, normalisation',
            'coefficient': 2.0,
            'couleur': '#8B5CF6',
            'icone': 'database'
        },
        {
            'code': 'BDD201',
            'nom': 'Bases de Données Avancées',
            'description': 'Optimisation, transactions, NoSQL, BigData',
            'coefficient': 2.5,
            'couleur': '#7C3AED',
            'icone': 'server'
        },

        # Développement Web
        {
            'code': 'WEB101',
            'nom': 'Développement Web Frontend',
            'description': 'HTML, CSS, JavaScript, frameworks modernes (React, Vue)',
            'coefficient': 2.0,
            'couleur': '#F59E0B',
            'icone': 'web'
        },
        {
            'code': 'WEB201',
            'nom': 'Développement Web Backend',
            'description': 'Node.js, Flask, Django, API REST, authentification',
            'coefficient': 2.5,
            'couleur': '#D97706',
            'icone': 'api'
        },
        {
            'code': 'WEB301',
            'nom': 'Développement Web Full-Stack',
            'description': 'Architecture client-serveur, déploiement, DevOps',
            'coefficient': 3.0,
            'couleur': '#B45309',
            'icone': 'fullstack'
        },

        # Réseaux et Systèmes
        {
            'code': 'SYS101',
            'nom': 'Systèmes d\'Exploitation',
            'description': 'Processus, mémoire, système de fichiers, Linux',
            'coefficient': 2.5,
            'couleur': '#EF4444',
            'icone': 'os'
        },
        {
            'code': 'NET101',
            'nom': 'Réseaux Informatiques',
            'description': 'Modèle OSI, TCP/IP, protocoles réseau, sécurité réseau',
            'coefficient': 2.5,
            'couleur': '#DC2626',
            'icone': 'network'
        },
        {
            'code': 'SEC101',
            'nom': 'Sécurité Informatique',
            'description': 'Cryptographie, sécurité des applications, tests d\'intrusion',
            'coefficient': 2.5,
            'couleur': '#991B1B',
            'icone': 'shield'
        },

        # Intelligence Artificielle et Machine Learning
        {
            'code': 'IA101',
            'nom': 'Introduction à l\'IA',
            'description': 'Concepts de base de l\'IA, agents intelligents, recherche',
            'coefficient': 2.5,
            'couleur': '#EC4899',
            'icone': 'ai'
        },
        {
            'code': 'ML201',
            'nom': 'Machine Learning',
            'description': 'Apprentissage supervisé, non supervisé, réseaux de neurones',
            'coefficient': 3.0,
            'couleur': '#DB2777',
            'icone': 'ml'
        },
        {
            'code': 'DL301',
            'nom': 'Deep Learning',
            'description': 'Réseaux de neurones profonds, CNN, RNN, Transformers',
            'coefficient': 3.0,
            'couleur': '#BE185D',
            'icone': 'deeplearning'
        },

        # Génie Logiciel
        {
            'code': 'GL101',
            'nom': 'Génie Logiciel',
            'description': 'Cycle de vie du logiciel, méthodologies Agile, tests',
            'coefficient': 2.0,
            'couleur': '#14B8A6',
            'icone': 'engineering'
        },
        {
            'code': 'GL201',
            'nom': 'Architecture Logicielle',
            'description': 'Design patterns, architecture microservices, clean code',
            'coefficient': 2.5,
            'couleur': '#0D9488',
            'icone': 'architecture'
        },

        # Mathématiques et Logique
        {
            'code': 'MATH101',
            'nom': 'Mathématiques pour l\'Informatique',
            'description': 'Logique, ensembles, relations, algèbre de Boole',
            'coefficient': 2.0,
            'couleur': '#6366F1',
            'icone': 'math'
        },
        {
            'code': 'STAT101',
            'nom': 'Probabilités et Statistiques',
            'description': 'Probabilités, distributions, inférence statistique',
            'coefficient': 2.0,
            'couleur': '#4F46E5',
            'icone': 'stats'
        },

        # Projet et Stage
        {
            'code': 'PROJ301',
            'nom': 'Projet de Développement',
            'description': 'Projet en équipe : conception, développement, présentation',
            'coefficient': 3.0,
            'couleur': '#F97316',
            'icone': 'project'
        },
        {
            'code': 'STAGE401',
            'nom': 'Stage en Entreprise',
            'description': 'Stage professionnel de fin d\'études',
            'coefficient': 4.0,
            'couleur': '#EA580C',
            'icone': 'internship'
        }
    ]

    created_count = 0
    for matiere_data in matieres_data:
        # Vérifier si la matière existe déjà
        existing = Matiere.query.filter_by(code=matiere_data['code']).first()
        if existing:
            print(f"  ⏭️  Matière {matiere_data['code']} existe déjà")
            continue

        matiere = Matiere(
            id=str(uuid.uuid4()),
            **matiere_data,
            actif=True
        )
        db.session.add(matiere)
        created_count += 1
        print(f"  ✅ Matière {matiere.code} - {matiere.nom} créée")

    db.session.commit()
    print(f"\n✅ {created_count} matières créées avec succès!")


def main():
    """Fonction principale"""
    print("="*60)
    print("🌱 ENRICHISSEMENT BASE DE DONNÉES - NIVEAUX & MATIÈRES")
    print("="*60)

    app = create_app()

    with app.app_context():
        try:
            # Créer les niveaux
            seed_niveaux()

            # Créer les matières
            seed_matieres()

            print("\n" + "="*60)
            print("✅ ENRICHISSEMENT TERMINÉ AVEC SUCCÈS !")
            print("="*60)

            # Afficher les statistiques
            total_niveaux = Niveau.query.count()
            total_matieres = Matiere.query.count()

            print(f"\n📊 Statistiques finales:")
            print(f"  - Niveaux : {total_niveaux}")
            print(f"  - Matières : {total_matieres}")

        except Exception as e:
            print(f"\n❌ Erreur lors de l'enrichissement: {e}")
            db.session.rollback()
            import traceback
            traceback.print_exc()
            sys.exit(1)


if __name__ == '__main__':
    main()
