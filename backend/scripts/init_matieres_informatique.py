"""
Script pour initialiser les matières d'un parcours informatique
"""
import sys
import os

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.matiere import Matiere
from app.models.mention import Mention
from app.models.parcours import Parcours

def clear_test_matieres():
    """Supprime toutes les matières existantes"""
    print("Suppression des matieres existantes...")
    try:
        # D'abord supprimer les associations dans les tables de liaison
        tables_to_clear = [
            'enseignant_matieres',
            'etudiant_matieres',
        ]
        
        for table in tables_to_clear:
            try:
                print(f"  - Suppression des associations {table}...")
                db.session.execute(db.text(f"DELETE FROM {table}"))
            except Exception as e:
                print(f"  [WARN] Table {table} non trouvee ou erreur: {e}")
        
        db.session.flush()
        
        # Maintenant supprimer les matières
        print("  - Suppression des matieres...")
        count = Matiere.query.delete()
        
        db.session.commit()
        print(f"[OK] {count} matieres supprimees")
    except Exception as e:
        db.session.rollback()
        print(f"[ERREUR] Erreur lors de la suppression: {e}")
        raise

def create_informatique_matieres():
    """Crée les matières pour le parcours informatique"""
    print("\nCreation des matieres du parcours informatique...")
    
    # Matières de base en informatique
    matieres = [
        # Programmation
        {
            'code': 'INFO101',
            'nom': 'Algorithmique et Structures de Données',
            'description': 'Introduction aux algorithmes fondamentaux et structures de données',
            'coefficient': 3.0,
            'couleur': '#3B82F6',
            'icone': 'code',
            'actif': True
        },
        {
            'code': 'INFO102',
            'nom': 'Programmation Orientée Objet',
            'description': 'Principes de la POO avec Java/Python',
            'coefficient': 3.0,
            'couleur': '#8B5CF6',
            'icone': 'box',
            'actif': True
        },
        {
            'code': 'INFO103',
            'nom': 'Développement Web',
            'description': 'HTML, CSS, JavaScript et frameworks modernes',
            'coefficient': 2.5,
            'couleur': '#10B981',
            'icone': 'globe',
            'actif': True
        },
        {
            'code': 'INFO104',
            'nom': 'Bases de Données',
            'description': 'SQL, modélisation et gestion de bases de données',
            'coefficient': 3.0,
            'couleur': '#F59E0B',
            'icone': 'database',
            'actif': True
        },
        {
            'code': 'INFO105',
            'nom': 'Systèmes d\'exploitation',
            'description': 'Architecture et gestion des systèmes',
            'coefficient': 2.5,
            'couleur': '#EF4444',
            'icone': 'server',
            'actif': True
        },
        {
            'code': 'INFO106',
            'nom': 'Réseaux et Internet',
            'description': 'Protocoles réseau, TCP/IP, architecture client-serveur',
            'coefficient': 2.5,
            'couleur': '#06B6D4',
            'icone': 'network',
            'actif': True
        },
        {
            'code': 'INFO201',
            'nom': 'Génie Logiciel',
            'description': 'Méthodologies de développement, UML, tests',
            'coefficient': 3.0,
            'couleur': '#6366F1',
            'icone': 'settings',
            'actif': True
        },
        {
            'code': 'INFO202',
            'nom': 'Intelligence Artificielle',
            'description': 'Machine Learning, réseaux de neurones',
            'coefficient': 3.0,
            'couleur': '#EC4899',
            'icone': 'brain',
            'actif': True
        },
        {
            'code': 'INFO203',
            'nom': 'Sécurité Informatique',
            'description': 'Cryptographie, sécurité des systèmes et réseaux',
            'coefficient': 2.5,
            'couleur': '#DC2626',
            'icone': 'shield',
            'actif': True
        },
        {
            'code': 'INFO204',
            'nom': 'Développement Mobile',
            'description': 'Applications Android/iOS, React Native',
            'coefficient': 2.5,
            'couleur': '#14B8A6',
            'icone': 'smartphone',
            'actif': True
        },
        # Mathématiques et sciences
        {
            'code': 'MATH101',
            'nom': 'Mathématiques Discrètes',
            'description': 'Logique, ensembles, graphes',
            'coefficient': 2.0,
            'couleur': '#7C3AED',
            'icone': 'calculator',
            'actif': True
        },
        {
            'code': 'MATH102',
            'nom': 'Probabilités et Statistiques',
            'description': 'Probabilités, statistiques descriptives et inférentielles',
            'coefficient': 2.0,
            'couleur': '#2563EB',
            'icone': 'chart',
            'actif': True
        },
        # Compétences transversales
        {
            'code': 'COM101',
            'nom': 'Communication Professionnelle',
            'description': 'Expression écrite et orale, présentation',
            'coefficient': 1.5,
            'couleur': '#F97316',
            'icone': 'message',
            'actif': True
        },
        {
            'code': 'ANG101',
            'nom': 'Anglais Technique',
            'description': 'Anglais appliqué à l\'informatique',
            'coefficient': 1.5,
            'couleur': '#84CC16',
            'icone': 'language',
            'actif': True
        },
        {
            'code': 'PROJ101',
            'nom': 'Projet Tutoré',
            'description': 'Projet de développement en équipe',
            'coefficient': 4.0,
            'couleur': '#A855F7',
            'icone': 'folder',
            'actif': True
        },
    ]
    
    created_count = 0
    for matiere_data in matieres:
        try:
            # Vérifier si la matière existe déjà
            existing = Matiere.query.filter_by(code=matiere_data['code']).first()
            if existing:
                print(f"[INFO] Matiere {matiere_data['code']} existe deja, mise a jour...")
                for key, value in matiere_data.items():
                    setattr(existing, key, value)
            else:
                matiere = Matiere(**matiere_data)
                db.session.add(matiere)
                print(f"[OK] Matiere creee: {matiere_data['code']} - {matiere_data['nom']}")
            created_count += 1
        except Exception as e:
            print(f"[ERREUR] Erreur creation {matiere_data['code']}: {e}")
    
    db.session.commit()
    print(f"\n[OK] {created_count} matieres creees/mises a jour avec succes!")

def display_matieres():
    """Affiche toutes les matières"""
    print("\nListe des matieres:")
    print("-" * 80)
    matieres = Matiere.query.order_by(Matiere.code).all()
    for matiere in matieres:
        print(f"{matiere.code:12} | {matiere.nom:45} | Coef: {matiere.coefficient}")
    print("-" * 80)
    print(f"Total: {len(matieres)} matieres")

def main():
    """Fonction principale"""
    app = create_app()
    
    with app.app_context():
        print("=" * 80)
        print("INITIALISATION DES MATIERES - PARCOURS INFORMATIQUE")
        print("=" * 80)
        
        print("\n[INFO] Ce script va ajouter/mettre a jour les matieres informatiques")
        print("[INFO] Les matieres existantes seront conservees")
        
        # Créer les nouvelles matières
        create_informatique_matieres()
        
        # Afficher le résultat
        display_matieres()
        
        print("\n[OK] Script termine avec succes!")
        print("=" * 80)

if __name__ == '__main__':
    main()

