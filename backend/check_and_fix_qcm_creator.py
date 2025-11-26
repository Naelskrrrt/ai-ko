"""
Script pour vérifier les QCM dans la DB et changer le créateur
"""
import sys
import os

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.qcm import QCM
from app.models.user import User
from datetime import datetime

def check_and_fix_qcm_creator():
    """Vérifie les QCM et change le créateur"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("VÉRIFICATION DES QCM DANS LA BASE DE DONNÉES")
        print("=" * 60)
        
        # 1. Lister tous les QCM
        qcms = QCM.query.all()
        print(f"\n📊 Nombre total de QCM dans la DB: {len(qcms)}")
        
        if len(qcms) == 0:
            print("❌ Aucun QCM trouvé dans la base de données")
            return
        
        print("\n" + "-" * 60)
        print("LISTE DES QCM:")
        print("-" * 60)
        
        for qcm in qcms:
            # Récupérer le créateur
            createur = User.query.get(qcm.createur_id) if qcm.createur_id else None
            createur_email = createur.email if createur else "N/A"
            createur_name = createur.name if createur else "N/A"
            
            # Compter les questions
            num_questions = len(qcm.questions) if hasattr(qcm, 'questions') else 0
            
            print(f"\n📝 QCM ID: {qcm.id}")
            print(f"   Titre: {qcm.titre}")
            print(f"   Statut: {qcm.status}")
            print(f"   Matière: {qcm.matiere or 'N/A'}")
            print(f"   Nombre de questions: {num_questions}")
            print(f"   Créateur ID: {qcm.createur_id}")
            print(f"   Créateur: {createur_name} ({createur_email})")
            print(f"   Créé le: {qcm.created_at}")
            print(f"   Modifié le: {qcm.updated_at}")
        
        # 2. Trouver l'utilisateur par email
        print("\n" + "=" * 60)
        print("RECHERCHE DE L'UTILISATEUR")
        print("=" * 60)
        
        target_email = "lalasonnael@gmail.com"
        target_user = User.query.filter_by(email=target_email).first()
        
        if not target_user:
            print(f"❌ Utilisateur avec l'email '{target_email}' non trouvé")
            print("\n📋 Liste des utilisateurs disponibles:")
            users = User.query.all()
            for user in users:
                print(f"   - {user.email} ({user.name or 'N/A'}, ID: {user.id})")
            return
        
        print(f"✅ Utilisateur trouvé:")
        print(f"   ID: {target_user.id}")
        print(f"   Nom: {target_user.name or 'N/A'}")
        print(f"   Email: {target_user.email}")
        print(f"   Rôle: {target_user.role}")
        
        # 3. Demander confirmation pour changer le créateur
        print("\n" + "=" * 60)
        print("MISE À JOUR DU CRÉATEUR")
        print("=" * 60)
        
        # QCM à mettre à jour (tous ceux qui n'ont pas déjà ce créateur)
        qcms_to_update = [qcm for qcm in qcms if qcm.createur_id != target_user.id]
        
        if len(qcms_to_update) == 0:
            print(f"✅ Tous les QCM ont déjà '{target_user.email}' comme créateur")
            return
        
        print(f"\n📝 {len(qcms_to_update)} QCM à mettre à jour:")
        for qcm in qcms_to_update:
            old_creator = User.query.get(qcm.createur_id) if qcm.createur_id else None
            old_email = old_creator.email if old_creator else "N/A"
            print(f"   - {qcm.titre} (actuel: {old_email})")
        
        # Mettre à jour
        print(f"\n🔄 Mise à jour en cours...")
        updated_count = 0
        
        for qcm in qcms_to_update:
            old_creator_id = qcm.createur_id
            qcm.createur_id = target_user.id
            qcm.updated_at = datetime.utcnow()
            updated_count += 1
            print(f"   ✅ {qcm.titre} mis à jour")
        
        # Commit les changements
        try:
            db.session.commit()
            print(f"\n✅ {updated_count} QCM mis à jour avec succès!")
            print(f"   Nouveau créateur: {target_user.email}")
        except Exception as e:
            db.session.rollback()
            print(f"\n❌ Erreur lors de la mise à jour: {e}")
            return
        
        # 4. Afficher le résultat final
        print("\n" + "=" * 60)
        print("RÉSULTAT FINAL")
        print("=" * 60)
        
        qcms_after = QCM.query.all()
        for qcm in qcms_after:
            createur = User.query.get(qcm.createur_id) if qcm.createur_id else None
            createur_email = createur.email if createur else "N/A"
            print(f"   {qcm.titre}: {createur_email}")

if __name__ == '__main__':
    check_and_fix_qcm_creator()

