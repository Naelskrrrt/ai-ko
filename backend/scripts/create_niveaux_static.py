"""
Script simple pour créer les niveaux statiques (L1, L2, L3, M1, M2)
"""
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.niveau import Niveau
import uuid

def create_niveaux_static():
    """Crée les niveaux statiques"""
    app = create_app()
    
    with app.app_context():
        niveaux_data = [
            {'code': 'L1', 'nom': 'Licence 1', 'ordre': 1, 'cycle': 'licence'},
            {'code': 'L2', 'nom': 'Licence 2', 'ordre': 2, 'cycle': 'licence'},
            {'code': 'L3', 'nom': 'Licence 3', 'ordre': 3, 'cycle': 'licence'},
            {'code': 'M1', 'nom': 'Master 1', 'ordre': 4, 'cycle': 'master'},
            {'code': 'M2', 'nom': 'Master 2', 'ordre': 5, 'cycle': 'master'},
        ]
        
        created = 0
        for niveau_data in niveaux_data:
            existing = Niveau.query.filter_by(code=niveau_data['code']).first()
            if existing:
                print(f"Niveau {niveau_data['code']} existe deja")
                continue
            
            niveau = Niveau(
                id=str(uuid.uuid4()),
                **niveau_data,
                actif=True
            )
            db.session.add(niveau)
            created += 1
            print(f"Niveau {niveau.code} - {niveau.nom} cree")
        
        db.session.commit()
        print(f"\n{created} niveaux crees avec succes!")

if __name__ == '__main__':
    create_niveaux_static()




