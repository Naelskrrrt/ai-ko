"""
Script de migration pour assigner des matiere_id aux QCMs existants
"""
from app import create_app, db
from app.models.qcm import QCM
from app.models.matiere import Matiere

def migrate_qcm_matieres():
    """
    Assigne un matiere_id aux QCMs qui n'en ont pas en se basant sur le champ matiere (texte)
    """
    app = create_app()
    with app.app_context():
        # Récupérer tous les QCMs sans matiere_id
        qcms_sans_matiere_id = QCM.query.filter(QCM.matiere_id == None).all()
        print(f"QCMs sans matiere_id: {len(qcms_sans_matiere_id)}")
        
        # Récupérer toutes les matières actives
        matieres = Matiere.query.filter_by(actif=True).all()
        print(f"Matières actives: {len(matieres)}")
        
        # Créer un mapping texte -> matiere_id
        matiere_mapping = {}
        for matiere in matieres:
            # Mapping exact (nom)
            matiere_mapping[matiere.nom.lower()] = matiere.id
            # Mapping par code
            matiere_mapping[matiere.code.lower()] = matiere.id
        
        print("\nMatières disponibles:")
        for m in matieres:
            print(f"  - {m.nom} ({m.code}) -> {m.id}")
        
        # Mappings personnalisés pour les anciens noms
        custom_mappings = {
            'informatique fondamentale': 'algorithmique et structures de données',
            'info101': 'algorithmique et structures de données',
            'algorithmique - bases': 'algorithmique et structures de données',
        }
        
        updated = 0
        not_found = []
        
        for qcm in qcms_sans_matiere_id:
            if not qcm.matiere:
                print(f"\n[ERREUR] QCM '{qcm.titre}' n'a pas de matiere (ni matiere_id ni matiere)")
                not_found.append((qcm.titre, "Aucune matiere"))
                continue
            
            matiere_texte = qcm.matiere.lower().strip()
            
            # Chercher une correspondance directe
            matiere_id = matiere_mapping.get(matiere_texte)
            
            # Si pas trouvé, essayer les mappings personnalisés
            if not matiere_id:
                matiere_cible = custom_mappings.get(matiere_texte)
                if matiere_cible:
                    matiere_id = matiere_mapping.get(matiere_cible.lower())
            
            # Si toujours pas trouvé, chercher par similarité partielle
            if not matiere_id:
                for key, mid in matiere_mapping.items():
                    if matiere_texte in key or key in matiere_texte:
                        matiere_id = mid
                        break
            
            if matiere_id:
                qcm.matiere_id = matiere_id
                matiere_obj = next((m for m in matieres if m.id == matiere_id), None)
                print(f"[OK] QCM '{qcm.titre}': '{qcm.matiere}' -> {matiere_obj.nom if matiere_obj else matiere_id}")
                updated += 1
            else:
                print(f"[ERREUR] QCM '{qcm.titre}': matiere '{qcm.matiere}' non trouvee")
                not_found.append((qcm.titre, qcm.matiere))
        
        if updated > 0:
            db.session.commit()
            print(f"\n[OK] {updated} QCM(s) mis a jour avec succes")
        
        if not_found:
            print(f"\n[ATTENTION] {len(not_found)} QCM(s) non mappes:")
            for titre, matiere in not_found:
                print(f"  - {titre}: {matiere}")
                
        print("\n" + "="*50)
        print("Migration terminée!")
        print(f"  - QCMs mis à jour: {updated}")
        print(f"  - QCMs non mappés: {len(not_found)}")

if __name__ == '__main__':
    migrate_qcm_matieres()

