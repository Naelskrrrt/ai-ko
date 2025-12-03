#!/usr/bin/env python3
"""
Script de création d'utilisateurs de test pour AI-KO
Crée : 1 Admin, 1 Enseignant (complet), 1 Étudiant (lié à l'enseignant)

Usage:
    python scripts/seed_users.py
    
Ou depuis Flask CLI:
    flask seed-users
"""

import sys
import os
from datetime import datetime, date

# Ajouter le répertoire parent au path pour les imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User, UserRole
from app.models.enseignant import Enseignant
from app.models.etudiant import Etudiant
from app.models.etablissement import Etablissement
from app.models.mention import Mention
from app.models.parcours import Parcours
from app.models.niveau import Niveau
from app.models.matiere import Matiere


def create_seed_data():
    """Crée les données de test"""
    
    print("=" * 60)
    print("🌱 SCRIPT DE CRÉATION D'UTILISATEURS DE TEST")
    print("=" * 60)
    
    # =========================================================================
    # 1. CRÉER L'ÉTABLISSEMENT
    # =========================================================================
    print("\n📍 Création de l'établissement...")
    
    etablissement = Etablissement.query.filter_by(code='ENI-UNIV').first()
    if not etablissement:
        etablissement = Etablissement(
            code='ENI-UNIV',
            nom='École Nationale d\'Informatique',
            nom_court='ENI',
            description='École d\'excellence en informatique et technologies numériques',
            type_etablissement='école',
            adresse='Lot VN 39 Ankatso',
            ville='Antananarivo',
            pays='Madagascar',
            code_postal='101',
            telephone='+261 20 22 412 19',
            email='contact@eni.mg',
            site_web='https://www.eni.mg',
            logo='https://www.eni.mg/logo.png',
            couleur_primaire='#1E40AF',
            actif=True
        )
        db.session.add(etablissement)
        db.session.flush()
        print(f"   ✅ Établissement créé: {etablissement.nom}")
    else:
        print(f"   ⚠️  Établissement existant: {etablissement.nom}")
    
    # =========================================================================
    # 2. CRÉER LA MENTION
    # =========================================================================
    print("\n📚 Création de la mention...")
    
    mention = Mention.query.filter_by(code='INFO').first()
    if not mention:
        mention = Mention(
            code='INFO',
            nom='Informatique',
            description='Formation en sciences informatiques et technologies de l\'information',
            etablissement_id=etablissement.id,
            couleur='#3B82F6',
            icone='computer',
            actif=True
        )
        db.session.add(mention)
        db.session.flush()
        print(f"   ✅ Mention créée: {mention.nom}")
    else:
        print(f"   ⚠️  Mention existante: {mention.nom}")
    
    # =========================================================================
    # 3. CRÉER LE PARCOURS
    # =========================================================================
    print("\n🛤️  Création du parcours...")
    
    parcours = Parcours.query.filter_by(code='IA-ML').first()
    if not parcours:
        parcours = Parcours(
            code='IA-ML',
            nom='Intelligence Artificielle et Machine Learning',
            description='Spécialisation en IA, apprentissage automatique et science des données',
            mention_id=mention.id,
            duree_annees=2,
            actif=True
        )
        db.session.add(parcours)
        db.session.flush()
        print(f"   ✅ Parcours créé: {parcours.nom}")
    else:
        print(f"   ⚠️  Parcours existant: {parcours.nom}")
    
    # =========================================================================
    # 4. CRÉER LE NIVEAU
    # =========================================================================
    print("\n📊 Création du niveau...")
    
    niveau = Niveau.query.filter_by(code='M1').first()
    if not niveau:
        niveau = Niveau(
            code='M1',
            nom='Master 1',
            description='Première année de Master',
            ordre=4,
            cycle='master',
            actif=True
        )
        db.session.add(niveau)
        db.session.flush()
        print(f"   ✅ Niveau créé: {niveau.nom}")
    else:
        print(f"   ⚠️  Niveau existant: {niveau.nom}")
    
    # =========================================================================
    # 5. CRÉER LES MATIÈRES
    # =========================================================================
    print("\n📖 Création des matières...")
    
    matieres_data = [
        {
            'code': 'ML-101',
            'nom': 'Machine Learning Fondamentaux',
            'description': 'Introduction aux algorithmes d\'apprentissage automatique',
            'coefficient': 3.0,
            'couleur': '#8B5CF6',
            'icone': 'brain'
        },
        {
            'code': 'DL-201',
            'nom': 'Deep Learning',
            'description': 'Réseaux de neurones profonds et architectures avancées',
            'coefficient': 4.0,
            'couleur': '#EC4899',
            'icone': 'network'
        },
        {
            'code': 'NLP-301',
            'nom': 'Traitement du Langage Naturel',
            'description': 'NLP, transformers et modèles de langage',
            'coefficient': 3.0,
            'couleur': '#10B981',
            'icone': 'message-square'
        }
    ]
    
    matieres = []
    for mat_data in matieres_data:
        matiere = Matiere.query.filter_by(code=mat_data['code']).first()
        if not matiere:
            matiere = Matiere(**mat_data, actif=True)
            db.session.add(matiere)
            db.session.flush()
            print(f"   ✅ Matière créée: {matiere.nom}")
        else:
            print(f"   ⚠️  Matière existante: {matiere.nom}")
        matieres.append(matiere)
    
    # =========================================================================
    # 6. CRÉER L'ADMIN
    # =========================================================================
    print("\n👑 Création de l'administrateur...")
    
    admin_user = User.query.filter_by(email='admin@ai-ko.mg').first()
    if not admin_user:
        admin_user = User(
            email='admin@ai-ko.mg',
            name='Administrateur AI-KO',
            role=UserRole.ADMIN,
            email_verified=True,
            is_active=True,
            telephone='+261 34 00 000 00',
            adresse='Antananarivo, Madagascar',
            date_naissance=date(1985, 1, 15)
        )
        admin_user.set_password('Admin@123')
        db.session.add(admin_user)
        db.session.flush()
        print(f"   ✅ Admin créé: {admin_user.email}")
        print(f"      📧 Email: admin@ai-ko.mg")
        print(f"      🔑 Mot de passe: Admin@123")
    else:
        print(f"   ⚠️  Admin existant: {admin_user.email}")
    
    # =========================================================================
    # 7. CRÉER L'ENSEIGNANT
    # =========================================================================
    print("\n👨‍🏫 Création de l'enseignant...")
    
    enseignant_user = User.query.filter_by(email='prof.rakoto@eni.mg').first()
    if not enseignant_user:
        enseignant_user = User(
            email='prof.rakoto@eni.mg',
            name='Dr. Jean RAKOTO',
            role=UserRole.ENSEIGNANT,
            email_verified=True,
            is_active=True,
            telephone='+261 34 12 345 67',
            adresse='Lot IVG 123, Analakely, Antananarivo',
            date_naissance=date(1975, 6, 20),
            avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=DrRakoto'
        )
        enseignant_user.set_password('Prof@123')
        db.session.add(enseignant_user)
        db.session.flush()
        
        # Créer le profil enseignant
        enseignant = Enseignant(
            user_id=enseignant_user.id,
            numero_enseignant='ENS-2024-001',
            grade='Maître de Conférences',
            specialite='Intelligence Artificielle et Machine Learning',
            departement='Département Informatique',
            bureau='Bureau A-204',
            horaires_disponibilite='Lundi: 08h-12h, Mercredi: 14h-17h, Vendredi: 09h-11h',
            etablissement_id=etablissement.id,
            date_embauche=date(2010, 9, 1),
            actif=True
        )
        db.session.add(enseignant)
        db.session.flush()
        
        # Associer les matières à l'enseignant
        for matiere in matieres:
            enseignant.matieres.append(matiere)
        
        # Associer le niveau à l'enseignant
        enseignant.niveaux.append(niveau)
        
        # Associer le parcours à l'enseignant
        enseignant.parcours.append(parcours)
        
        # Associer la mention à l'enseignant
        enseignant.mentions.append(mention)
        
        db.session.flush()
        
        print(f"   ✅ Enseignant créé: {enseignant_user.name}")
        print(f"      📧 Email: prof.rakoto@eni.mg")
        print(f"      🔑 Mot de passe: Prof@123")
        print(f"      🆔 Numéro: {enseignant.numero_enseignant}")
        print(f"      🎓 Grade: {enseignant.grade}")
        print(f"      🔬 Spécialité: {enseignant.specialite}")
        print(f"      🏢 Département: {enseignant.departement}")
        print(f"      📍 Bureau: {enseignant.bureau}")
        print(f"      📚 Matières: {', '.join([m.nom for m in matieres])}")
    else:
        print(f"   ⚠️  Enseignant existant: {enseignant_user.email}")
        enseignant = Enseignant.query.filter_by(user_id=enseignant_user.id).first()
    
    # =========================================================================
    # 8. CRÉER L'ÉTUDIANT
    # =========================================================================
    print("\n👨‍🎓 Création de l'étudiant...")
    
    etudiant_user = User.query.filter_by(email='etudiant.randria@eni.mg').first()
    if not etudiant_user:
        etudiant_user = User(
            email='etudiant.randria@eni.mg',
            name='Marie RANDRIANARISOA',
            role=UserRole.ETUDIANT,
            email_verified=True,
            is_active=True,
            telephone='+261 33 98 765 43',
            adresse='Lot II J 45, Ambohipo, Antananarivo',
            date_naissance=date(2000, 3, 25),
            avatar='https://api.dicebear.com/7.x/avataaars/svg?seed=MarieR'
        )
        etudiant_user.set_password('Etud@123')
        db.session.add(etudiant_user)
        db.session.flush()
        
        # Créer le profil étudiant
        etudiant = Etudiant(
            user_id=etudiant_user.id,
            numero_etudiant='ETU-2024-0042',
            annee_admission='2023-2024',
            etablissement_id=etablissement.id,
            mention_id=mention.id,
            parcours_id=parcours.id,
            niveau_id=niveau.id,
            actif=True
        )
        db.session.add(etudiant)
        db.session.flush()
        
        # Associer les mêmes matières que l'enseignant
        for matiere in matieres:
            etudiant.matieres.append(matiere)
        
        db.session.flush()
        
        print(f"   ✅ Étudiant créé: {etudiant_user.name}")
        print(f"      📧 Email: etudiant.randria@eni.mg")
        print(f"      🔑 Mot de passe: Etud@123")
        print(f"      🆔 Numéro: {etudiant.numero_etudiant}")
        print(f"      📅 Année d'admission: {etudiant.annee_admission}")
        print(f"      🏫 Établissement: {etablissement.nom}")
        print(f"      📚 Mention: {mention.nom}")
        print(f"      🛤️  Parcours: {parcours.nom}")
        print(f"      📊 Niveau: {niveau.nom}")
        print(f"      📖 Matières: {', '.join([m.nom for m in matieres])}")
    else:
        print(f"   ⚠️  Étudiant existant: {etudiant_user.email}")
    
    # =========================================================================
    # COMMIT FINAL
    # =========================================================================
    db.session.commit()
    
    print("\n" + "=" * 60)
    print("✅ CRÉATION TERMINÉE AVEC SUCCÈS!")
    print("=" * 60)
    
    print("\n📋 RÉCAPITULATIF DES COMPTES:")
    print("-" * 60)
    print("| Rôle       | Email                      | Mot de passe |")
    print("-" * 60)
    print("| Admin      | admin@ai-ko.mg             | Admin@123    |")
    print("| Enseignant | prof.rakoto@eni.mg         | Prof@123     |")
    print("| Étudiant   | etudiant.randria@eni.mg    | Etud@123     |")
    print("-" * 60)
    
    print("\n🔗 RELATIONS:")
    print(f"   • L'enseignant et l'étudiant sont dans le même établissement: {etablissement.nom}")
    print(f"   • Ils partagent les mêmes matières: {', '.join([m.code for m in matieres])}")
    print(f"   • L'étudiant est dans le parcours: {parcours.nom}")
    print(f"   • Au niveau: {niveau.nom}")
    
    return True


def main():
    """Point d'entrée principal"""
    app = create_app()
    
    with app.app_context():
        try:
            create_seed_data()
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ ERREUR: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)



