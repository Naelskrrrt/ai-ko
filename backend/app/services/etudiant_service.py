"""
Service pour la gestion des Étudiants avec logique métier
"""
from typing import Dict, Any, Optional, List
from app.repositories.etudiant_repository import EtudiantRepository
from app.repositories.etablissement_repository import EtablissementRepository
from app.repositories.user_repository import UserRepository
from app.repositories.mention_repository import MentionRepository
from app.repositories.parcours_repository import ParcoursRepository
from app.repositories.niveau_repository import NiveauRepository
from app.models.etudiant import Etudiant
from app.models.user import UserRole


class EtudiantService:
    """Service pour la gestion des Étudiants"""

    def __init__(self):
        self.etudiant_repo = EtudiantRepository()
        self.etablissement_repo = EtablissementRepository()
        self.user_repo = UserRepository()
        self.mention_repo = MentionRepository()
        self.parcours_repo = ParcoursRepository()
        self.niveau_repo = NiveauRepository()

    def get_all_etudiants(self, actifs_seulement: bool = False, page: int = 1, per_page: int = 50) -> Dict[str, Any]:
        """Récupère tous les étudiants avec pagination"""
        if actifs_seulement:
            etudiants = self.etudiant_repo.get_actifs()
        else:
            etudiants = self.etudiant_repo.get_all()
        
        # Pagination simple
        total = len(etudiants)
        start = (page - 1) * per_page
        end = start + per_page
        etudiants_page = etudiants[start:end]
        
        return {
            'items': [e.to_dict() for e in etudiants_page],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }

    def get_etudiant_by_id(self, etudiant_id: str, include_relations: bool = False) -> Optional[Dict[str, Any]]:
        """Récupère un étudiant par son ID"""
        etudiant = self.etudiant_repo.get_by_id(etudiant_id)
        return etudiant.to_dict(include_relations=include_relations) if etudiant else None

    def get_etudiant_by_user_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Récupère un étudiant par son user_id"""
        etudiant = self.etudiant_repo.get_by_user_id(user_id)
        return etudiant.to_dict() if etudiant else None

    def get_etudiant_by_numero(self, numero_etudiant: str) -> Optional[Dict[str, Any]]:
        """Récupère un étudiant par son numéro"""
        etudiant = self.etudiant_repo.get_by_numero(numero_etudiant)
        return etudiant.to_dict() if etudiant else None

    def get_etudiants_by_etablissement(self, etablissement_id: str) -> List[Dict[str, Any]]:
        """Récupère les étudiants d'un établissement"""
        etudiants = self.etudiant_repo.get_by_etablissement(etablissement_id)
        return [e.to_dict() for e in etudiants]

    def get_etudiants_by_mention(self, mention_id: str) -> List[Dict[str, Any]]:
        """Récupère les étudiants d'une mention"""
        etudiants = self.etudiant_repo.get_by_mention(mention_id)
        return [e.to_dict() for e in etudiants]

    def get_etudiants_by_parcours(self, parcours_id: str) -> List[Dict[str, Any]]:
        """Récupère les étudiants d'un parcours"""
        etudiants = self.etudiant_repo.get_by_parcours(parcours_id)
        return [e.to_dict() for e in etudiants]

    def get_etudiants_by_niveau(self, niveau_id: str) -> List[Dict[str, Any]]:
        """Récupère les étudiants d'un niveau"""
        etudiants = self.etudiant_repo.get_by_niveau(niveau_id)
        return [e.to_dict() for e in etudiants]

    def create_etudiant(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un nouvel étudiant avec validations"""
        # Validation user_id
        user_id = data.get('user_id', '').strip()
        if not user_id:
            raise ValueError("L'utilisateur est obligatoire")
        
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        # Vérifier que l'utilisateur n'a pas déjà un profil étudiant
        if self.etudiant_repo.get_by_user_id(user_id):
            raise ValueError("Cet utilisateur a déjà un profil étudiant")
        
        # Le user doit avoir le rôle ETUDIANT
        if user.role != UserRole.ETUDIANT:
            raise ValueError("L'utilisateur doit avoir le rôle ETUDIANT")
        
        # Validation numero_etudiant
        numero_etudiant = data.get('numero_etudiant', '').strip()
        if not numero_etudiant or len(numero_etudiant) < 3:
            raise ValueError("Le numéro d'étudiant doit contenir au moins 3 caractères")
        
        # Vérifier unicité du numéro
        if self.etudiant_repo.get_by_numero(numero_etudiant):
            raise ValueError(f"Un étudiant avec le numéro {numero_etudiant} existe déjà")
        
        # Validation etablissement_id
        etablissement_id = data.get('etablissement_id', '').strip()
        if not etablissement_id:
            raise ValueError("L'établissement est obligatoire")
        
        etablissement = self.etablissement_repo.get_by_id(etablissement_id)
        if not etablissement:
            raise ValueError("Établissement non trouvé")
        
        # Validation mention_id (optionnel)
        mention_id = data.get('mention_id', '').strip() if data.get('mention_id') else None
        if mention_id:
            mention = self.mention_repo.get_by_id(mention_id)
            if not mention:
                raise ValueError("Mention non trouvée")
        
        # Validation parcours_id (optionnel)
        parcours_id = data.get('parcours_id', '').strip() if data.get('parcours_id') else None
        if parcours_id:
            parcours = self.parcours_repo.get_by_id(parcours_id)
            if not parcours:
                raise ValueError("Parcours non trouvé")
        
        # Validation niveau_id (optionnel)
        niveau_id = data.get('niveau_id', '').strip() if data.get('niveau_id') else None
        if niveau_id:
            niveau = self.niveau_repo.get_by_id(niveau_id)
            if not niveau:
                raise ValueError("Niveau non trouvé")
        
        # Créer l'étudiant
        etudiant = Etudiant(
            user_id=user_id,
            numero_etudiant=numero_etudiant,
            annee_admission=data.get('annee_admission', '').strip() if data.get('annee_admission') else None,
            etablissement_id=etablissement_id,
            mention_id=mention_id,
            parcours_id=parcours_id,
            niveau_id=niveau_id,
            actif=data.get('actif', True)
        )
        
        etudiant = self.etudiant_repo.create(etudiant)
        return etudiant.to_dict()

    def update_etudiant(self, etudiant_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour un étudiant"""
        etudiant = self.etudiant_repo.get_by_id(etudiant_id)
        if not etudiant:
            raise ValueError("Étudiant non trouvé")
        
        # Validation numero_etudiant
        if 'numero_etudiant' in data:
            numero_etudiant = data['numero_etudiant'].strip()
            if len(numero_etudiant) < 3:
                raise ValueError("Le numéro d'étudiant doit contenir au moins 3 caractères")
            
            existing = self.etudiant_repo.get_by_numero(numero_etudiant)
            if existing and existing.id != etudiant_id:
                raise ValueError(f"Un étudiant avec le numéro {numero_etudiant} existe déjà")
            
            etudiant.numero_etudiant = numero_etudiant
        
        # Validation etablissement_id
        if 'etablissement_id' in data:
            etablissement_id = data['etablissement_id'].strip()
            etablissement = self.etablissement_repo.get_by_id(etablissement_id)
            if not etablissement:
                raise ValueError("Établissement non trouvé")
            etudiant.etablissement_id = etablissement_id
        
        # Validation mention_id
        if 'mention_id' in data:
            mention_id = data['mention_id'].strip() if data['mention_id'] else None
            if mention_id:
                mention = self.mention_repo.get_by_id(mention_id)
                if not mention:
                    raise ValueError("Mention non trouvée")
            etudiant.mention_id = mention_id
        
        # Validation parcours_id
        if 'parcours_id' in data:
            parcours_id = data['parcours_id'].strip() if data['parcours_id'] else None
            if parcours_id:
                parcours = self.parcours_repo.get_by_id(parcours_id)
                if not parcours:
                    raise ValueError("Parcours non trouvé")
            etudiant.parcours_id = parcours_id
        
        # Validation niveau_id
        if 'niveau_id' in data:
            niveau_id = data['niveau_id'].strip() if data['niveau_id'] else None
            if niveau_id:
                niveau = self.niveau_repo.get_by_id(niveau_id)
                if not niveau:
                    raise ValueError("Niveau non trouvé")
            etudiant.niveau_id = niveau_id
        
        # Mettre à jour les autres champs
        if 'annee_admission' in data:
            etudiant.annee_admission = data['annee_admission'].strip() if data['annee_admission'] else None
        
        if 'actif' in data:
            etudiant.actif = bool(data['actif'])
        
        # Gestion des matières (relation many-to-many)
        if 'matieres' in data:
            if isinstance(data['matieres'], list):
                # C'est une liste d'IDs de matières
                from app import db
                from app.repositories.matiere_repository import MatiereRepository
                from datetime import datetime
                
                # Calculer l'année scolaire actuelle (format: "2024-2025")
                current_year = datetime.now().year
                annee_scolaire = f"{current_year}-{current_year + 1}"
                
                # Supprimer toutes les associations existantes
                db.session.execute(
                    db.text("DELETE FROM etudiant_matieres_v2 WHERE etudiant_id = :etudiant_id"),
                    {"etudiant_id": etudiant.id}
                )
                db.session.flush()
                
                # Ajouter les nouvelles matières
                matiere_repo = MatiereRepository()
                for matiere_id in data['matieres']:
                    matiere = matiere_repo.get_by_id(matiere_id)
                    if matiere and matiere.actif:
                        db.session.execute(
                            db.text("INSERT INTO etudiant_matieres_v2 (etudiant_id, matiere_id, annee_scolaire) VALUES (:etudiant_id, :matiere_id, :annee_scolaire)"),
                            {"etudiant_id": etudiant.id, "matiere_id": matiere.id, "annee_scolaire": annee_scolaire}
                        )
                db.session.flush()
        
        etudiant = self.etudiant_repo.update(etudiant)
        return etudiant.to_dict()

    def delete_etudiant(self, etudiant_id: str) -> bool:
        """Supprime un étudiant"""
        etudiant = self.etudiant_repo.get_by_id(etudiant_id)
        if not etudiant:
            raise ValueError("Étudiant non trouvé")
        
        return self.etudiant_repo.delete(etudiant)

    def search_etudiants(self, query: str) -> List[Dict[str, Any]]:
        """Recherche des étudiants"""
        etudiants = self.etudiant_repo.search(query)
        return [e.to_dict() for e in etudiants]

    # Gestion des relations

    def get_matieres(self, etudiant_id: str) -> List[Dict[str, Any]]:
        """Récupère les matières d'un étudiant"""
        matieres = self.etudiant_repo.get_matieres(etudiant_id)
        return [m.to_dict() for m in matieres]

    def enroll_matiere(self, etudiant_id: str, matiere_id: str) -> bool:
        """Inscrit un étudiant à une matière"""
        etudiant = self.etudiant_repo.get_by_id(etudiant_id)
        if not etudiant:
            raise ValueError("Étudiant non trouvé")
        
        return self.etudiant_repo.add_matiere(etudiant_id, matiere_id)

    def unenroll_matiere(self, etudiant_id: str, matiere_id: str) -> bool:
        """Désinscrit un étudiant d'une matière"""
        return self.etudiant_repo.remove_matiere(etudiant_id, matiere_id)

    def get_classes(self, etudiant_id: str) -> List[Dict[str, Any]]:
        """Récupère les classes d'un étudiant"""
        classes = self.etudiant_repo.get_classes(etudiant_id)
        return [c.to_dict() for c in classes]

    def assign_classe(self, etudiant_id: str, classe_id: str) -> bool:
        """Assigne un étudiant à une classe"""
        etudiant = self.etudiant_repo.get_by_id(etudiant_id)
        if not etudiant:
            raise ValueError("Étudiant non trouvé")
        
        return self.etudiant_repo.add_classe(etudiant_id, classe_id)

    def update_niveau(self, etudiant_id: str, niveau_id: str) -> Dict[str, Any]:
        """Met à jour le niveau d'un étudiant"""
        etudiant = self.etudiant_repo.get_by_id(etudiant_id)
        if not etudiant:
            raise ValueError("Étudiant non trouvé")
        
        niveau = self.niveau_repo.get_by_id(niveau_id)
        if not niveau:
            raise ValueError("Niveau non trouvé")
        
        etudiant.niveau_id = niveau_id
        etudiant = self.etudiant_repo.update(etudiant)
        return etudiant.to_dict()

    def get_progression(self, etudiant_id: str) -> Dict[str, Any]:
        """Récupère la progression d'un étudiant"""
        etudiant = self.etudiant_repo.get_by_id(etudiant_id)
        if not etudiant:
            raise ValueError("Étudiant non trouvé")
        
        matieres = list(etudiant.matieres)
        classes = list(etudiant.classes)
        
        return {
            'etudiant': etudiant.to_dict(),
            'nombre_matieres': len(matieres),
            'nombre_classes': len(classes),
            'matieres': [m.to_dict() for m in matieres],
            'classes': [c.to_dict() for c in classes]
        }

