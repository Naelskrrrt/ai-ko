"""
Script pour tester l'API QCM et vérifier les données retournées
"""
import sys
import os
import requests
import json

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.qcm import QCM
from app.models.user import User

def test_qcm_api():
    """Teste l'API QCM"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("TEST DE L'API QCM")
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
        print(f"   Rôle: {user.role}")
        
        # 2. Vérifier les QCM de cet utilisateur
        print(f"\n📊 QCM de cet utilisateur dans la DB:")
        qcms = QCM.query.filter_by(createur_id=user.id).all()
        print(f"   Nombre: {len(qcms)}")
        
        for qcm in qcms:
            num_questions = len(qcm.questions) if hasattr(qcm, 'questions') else 0
            print(f"   - {qcm.titre} (ID: {qcm.id}, Status: {qcm.status}, Questions: {num_questions})")
        
        # 3. Vérifier le filtre dans le repository
        print(f"\n🔍 Test du filtre dans le repository:")
        from app.repositories.qcm_repository import QCMRepository
        from app.repositories.user_repository import UserRepository
        
        qcm_repo = QCMRepository()
        user_repo = UserRepository()
        
        # Simuler un filtre comme dans l'API
        filters = {'createur_id': user.id}
        qcms_filtered, total = qcm_repo.get_all_paginated(skip=0, limit=100, filters=filters)
        
        print(f"   QCM trouvés avec filtre createur_id: {len(qcms_filtered)}")
        for qcm in qcms_filtered:
            print(f"   - {qcm.titre}")
        
        # 4. Vérifier si l'utilisateur est admin
        from app.models.user import UserRole
        is_admin = user.role == UserRole.ADMIN
        print(f"\n👤 Rôle utilisateur: {user.role}")
        print(f"   Est admin: {is_admin}")
        print(f"   Filtre appliqué: {'Non (admin voit tout)' if is_admin else f'Oui (createur_id={user.id})'}")

if __name__ == '__main__':
    test_qcm_api()







