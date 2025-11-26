"""
Script pour tester la réponse de l'API QCM
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.services.qcm_service import QCMService
from app.models.user import User
from app.models.user import UserRole

def test_api_response():
    """Teste le format de réponse de l'API"""
    app = create_app()
    
    with app.app_context():
        print("=" * 60)
        print("TEST DU FORMAT DE RÉPONSE API")
        print("=" * 60)
        
        # 1. Trouver l'utilisateur
        user = User.query.filter_by(email="lalasonnael@gmail.com").first()
        if not user:
            print("❌ Utilisateur non trouvé")
            return
        
        print(f"\n✅ Utilisateur: {user.email} (ID: {user.id})")
        print(f"   Rôle: {user.role}")
        
        # 2. Simuler l'appel au service
        qcm_service = QCMService()
        
        # Filtrer par créateur (comme dans l'API)
        filters = {}
        if user.role != UserRole.ADMIN:
            filters['createur_id'] = user.id
        
        print(f"\n🔍 Filtres appliqués: {filters}")
        
        qcms, total = qcm_service.get_qcms(filters=filters, skip=0, limit=100)
        
        print(f"\n📊 Résultats:")
        print(f"   Total: {total}")
        print(f"   Nombre de QCM retournés: {len(qcms)}")
        
        if len(qcms) > 0:
            print(f"\n📝 Premier QCM (exemple):")
            first_qcm = qcms[0]
            print(f"   ID: {first_qcm.get('id')}")
            print(f"   Titre: {first_qcm.get('titre')}")
            print(f"   Status: {first_qcm.get('status')}")
            print(f"   Créateur ID: {first_qcm.get('createurId')}")
            print(f"   Nombre de questions: {first_qcm.get('nombreQuestions')}")
            print(f"\n   Structure complète:")
            import json
            print(json.dumps(first_qcm, indent=2, ensure_ascii=False, default=str))
        else:
            print("\n❌ Aucun QCM retourné!")

if __name__ == '__main__':
    test_api_response()







