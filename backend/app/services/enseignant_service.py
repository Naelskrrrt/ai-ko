"""
Service pour la gestion des Enseignants avec logique métier
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.repositories.enseignant_repository import EnseignantRepository
from app.repositories.etablissement_repository import EtablissementRepository
from app.repositories.user_repository import UserRepository
from app.repositories.matiere_repository import MatiereRepository
from app.repositories.niveau_repository import NiveauRepository
from app.repositories.parcours_repository import ParcoursRepository
from app.repositories.mention_repository import MentionRepository
from app.repositories.etudiant_repository import EtudiantRepository
from app.repositories.session_examen_repository import SessionExamenRepository
from app.repositories.resultat_repository import ResultatRepository
from app.repositories.qcm_repository import QCMRepository
from app.models.enseignant import Enseignant
from app.models.user import UserRole
from app import db
from app.services.pdf_service import PDFService


class EnseignantService:
    """Service pour la gestion des Enseignants"""

    def __init__(self):
        self.enseignant_repo = EnseignantRepository()
        self.etablissement_repo = EtablissementRepository()
        self.user_repo = UserRepository()
        self.matiere_repo = MatiereRepository()
        self.niveau_repo = NiveauRepository()
        self.parcours_repo = ParcoursRepository()
        self.mention_repo = MentionRepository()
        self.etudiant_repo = EtudiantRepository()
        self.session_repo = SessionExamenRepository()
        self.resultat_repo = ResultatRepository()
        self.qcm_repo = QCMRepository()
        self.pdf_service = PDFService()

    def get_all_enseignants(self, actifs_seulement: bool = False, page: int = 1, per_page: int = 50) -> Dict[str, Any]:
        """Récupère tous les enseignants avec pagination"""
        if actifs_seulement:
            enseignants = self.enseignant_repo.get_actifs()
        else:
            enseignants = self.enseignant_repo.get_all()

        # Pagination simple
        total = len(enseignants)
        start = (page - 1) * per_page
        end = start + per_page
        enseignants_page = enseignants[start:end]

        return {
            'items': [e.to_dict() for e in enseignants_page],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }

    def get_enseignant_by_id(self, enseignant_id: str, include_relations: bool = False) -> Optional[Dict[str, Any]]:
        """Récupère un enseignant par son ID"""
        enseignant = self.enseignant_repo.get_by_id(enseignant_id)
        if not enseignant:
            return None

        result = enseignant.to_dict()

        if include_relations:
            result['matieres'] = [m.to_dict() for m in enseignant.matieres]
            result['niveaux'] = [n.to_dict() for n in enseignant.niveaux]
            result['parcours'] = [p.to_dict() for p in enseignant.parcours]
            result['mentions'] = [m.to_dict() for m in enseignant.mentions]
            if enseignant.user:
                result['user'] = enseignant.user.to_dict()
            if enseignant.etablissement:
                result['etablissement'] = enseignant.etablissement.to_dict()

        return result

    def get_enseignant_by_user_id(self, user_id: str, include_relations: bool = False) -> Optional[Dict[str, Any]]:
        """Récupère un enseignant par son user_id"""
        enseignant = self.enseignant_repo.get_by_user_id(user_id)
        if not enseignant:
            return None

        result = enseignant.to_dict()

        if include_relations:
            result['matieres'] = [m.to_dict() for m in enseignant.matieres]
            result['niveaux'] = [n.to_dict() for n in enseignant.niveaux]
            result['parcours'] = [p.to_dict() for p in enseignant.parcours]
            result['mentions'] = [m.to_dict() for m in enseignant.mentions]
            if enseignant.user:
                result['user'] = enseignant.user.to_dict()
            if enseignant.etablissement:
                result['etablissement'] = enseignant.etablissement.to_dict()

        return result

    def create_enseignant(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un nouvel enseignant"""
        # Vérifier que l'utilisateur existe et est un enseignant
        user = self.user_repo.get_by_id(data.get('user_id'))
        if not user:
            raise ValueError("Utilisateur non trouvé")
        if user.role != UserRole.ENSEIGNANT:
            raise ValueError("L'utilisateur doit avoir le rôle ENSEIGNANT")

        # Vérifier que l'établissement existe
        etablissement = self.etablissement_repo.get_by_id(
            data.get('etablissement_id'))
        if not etablissement:
            raise ValueError("Établissement non trouvé")

        # Vérifier l'unicité du numéro
        if self.enseignant_repo.get_by_numero(data.get('numero_enseignant')):
            raise ValueError("Ce numéro d'enseignant existe déjà")

        # Créer l'enseignant
        enseignant = Enseignant(**data)
        enseignant = self.enseignant_repo.create(enseignant)

        return enseignant.to_dict()

    def update_enseignant(self, enseignant_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour un enseignant"""
        enseignant = self.enseignant_repo.get_by_id(enseignant_id)
        if not enseignant:
            raise ValueError(f"Enseignant {enseignant_id} non trouvé")

        # Mettre à jour les champs autorisés
        allowed_fields = [
            'grade', 'specialite', 'departement', 'bureau',
            'horaires_disponibilite', 'date_embauche', 'actif'
        ]

        for field in allowed_fields:
            if field in data:
                setattr(enseignant, field, data[field])

        # Gestion des matières (relation many-to-many)
        if 'matieres' in data:
            if isinstance(data['matieres'], list):
                # C'est une liste d'IDs de matières
                # Supprimer toutes les associations existantes
                db.session.execute(
                    db.text(
                        "DELETE FROM enseignant_matieres WHERE enseignant_id = :enseignant_id"),
                    {"enseignant_id": enseignant.id}
                )
                db.session.flush()

                # Ajouter les nouvelles matières
                for matiere_id in data['matieres']:
                    matiere = self.matiere_repo.get_by_id(matiere_id)
                    if matiere and matiere.actif:
                        db.session.execute(
                            db.text(
                                "INSERT INTO enseignant_matieres (enseignant_id, matiere_id) VALUES (:enseignant_id, :matiere_id)"),
                            {"enseignant_id": enseignant.id,
                                "matiere_id": matiere.id}
                        )
                db.session.flush()

        enseignant = self.enseignant_repo.update(enseignant)
        return enseignant.to_dict()

    def delete_enseignant(self, enseignant_id: str) -> bool:
        """Supprime un enseignant (soft delete)"""
        enseignant = self.enseignant_repo.get_by_id(enseignant_id)
        if not enseignant:
            raise ValueError(f"Enseignant {enseignant_id} non trouvé")

        enseignant.actif = False
        self.enseignant_repo.update(enseignant)
        return True

    def get_matieres(self, enseignant_id: str) -> List[Dict[str, Any]]:
        """Récupère les matières d'un enseignant"""
        matieres = self.enseignant_repo.get_matieres(enseignant_id)
        return [m.to_dict() for m in matieres]

    def assign_matiere(self, enseignant_id: str, matiere_id: str) -> bool:
        """Assigne une matière à un enseignant"""
        matiere = self.matiere_repo.get_by_id(matiere_id)
        if not matiere:
            raise ValueError("Matière non trouvée")

        return self.enseignant_repo.add_matiere(enseignant_id, matiere_id)

    def unassign_matiere(self, enseignant_id: str, matiere_id: str) -> bool:
        """Retire une matière d'un enseignant"""
        return self.enseignant_repo.remove_matiere(enseignant_id, matiere_id)

    def update_matieres(self, enseignant_id: str, matieres_ids: List[str]) -> bool:
        """Met à jour toutes les matières d'un enseignant"""
        enseignant = self.enseignant_repo.get_by_id(enseignant_id)
        if not enseignant:
            raise ValueError("Enseignant non trouvé")
        
        # Supprimer toutes les anciennes associations
        enseignant.matieres.clear()
        
        # Ajouter les nouvelles matières
        for matiere_id in matieres_ids:
            matiere = self.matiere_repo.get_by_id(matiere_id)
            if matiere:
                enseignant.matieres.append(matiere)
        
        db.session.commit()
        return True

    def get_niveaux(self, enseignant_id: str) -> List[Dict[str, Any]]:
        """Récupère les niveaux d'un enseignant"""
        niveaux = self.enseignant_repo.get_niveaux(enseignant_id)
        return [n.to_dict() for n in niveaux]

    def assign_niveau(self, enseignant_id: str, niveau_id: str) -> bool:
        """Assigne un niveau à un enseignant"""
        niveau = self.niveau_repo.get_by_id(niveau_id)
        if not niveau:
            raise ValueError("Niveau non trouvé")

        return self.enseignant_repo.add_niveau(enseignant_id, niveau_id)

    def get_parcours(self, enseignant_id: str) -> List[Dict[str, Any]]:
        """Récupère les parcours d'un enseignant"""
        parcours = self.enseignant_repo.get_parcours(enseignant_id)
        return [p.to_dict() for p in parcours]

    def assign_parcours(self, enseignant_id: str, parcours_id: str) -> bool:
        """Assigne un parcours à un enseignant"""
        parcours = self.parcours_repo.get_by_id(parcours_id)
        if not parcours:
            raise ValueError("Parcours non trouvé")

        return self.enseignant_repo.add_parcours(enseignant_id, parcours_id)

    def get_mentions(self, enseignant_id: str) -> List[Dict[str, Any]]:
        """Récupère les mentions d'un enseignant"""
        mentions = self.enseignant_repo.get_mentions(enseignant_id)
        return [m.to_dict() for m in mentions]

    def get_enseignants_by_etablissement(self, etablissement_id: str) -> List[Dict[str, Any]]:
        """Récupère tous les enseignants d'un établissement"""
        enseignants = self.enseignant_repo.get_by_etablissement(
            etablissement_id)
        return [e.to_dict() for e in enseignants]

    def get_etudiants_lies(
        self,
        enseignant_id: str,
        niveau_id: Optional[str] = None,
        matiere_id: Optional[str] = None,
        parcours_id: Optional[str] = None,
        mention_id: Optional[str] = None,
        annee_scolaire: Optional[str] = None,
        page: int = 1,
        per_page: int = 50
    ) -> Dict[str, Any]:
        """
        Récupère les étudiants liés à un enseignant basé sur les critères communs
        (matières, niveaux, parcours, mentions)
        """
        enseignant = self.enseignant_repo.get_by_id(enseignant_id)
        if not enseignant:
            raise ValueError(f"Enseignant {enseignant_id} non trouvé")

        # Récupérer les critères de l'enseignant
        enseignant_matieres_ids = [m.id for m in enseignant.matieres]
        enseignant_niveaux_ids = [n.id for n in enseignant.niveaux]
        enseignant_parcours_ids = [p.id for p in enseignant.parcours]
        enseignant_mentions_ids = [m.id for m in enseignant.mentions]

        # Construire la requête pour les étudiants
        from app.models.etudiant import Etudiant
        from app.models.associations import etudiant_matieres_v2

        query = db.session.query(Etudiant).filter(Etudiant.actif == True)

        # Appliquer les filtres si spécifiés
        if niveau_id:
            query = query.filter(Etudiant.niveau_id == niveau_id)
        elif enseignant_niveaux_ids:
            query = query.filter(
                Etudiant.niveau_id.in_(enseignant_niveaux_ids))

        if parcours_id:
            query = query.filter(Etudiant.parcours_id == parcours_id)
        elif enseignant_parcours_ids:
            query = query.filter(
                Etudiant.parcours_id.in_(enseignant_parcours_ids))

        if mention_id:
            query = query.filter(Etudiant.mention_id == mention_id)
        elif enseignant_mentions_ids:
            query = query.filter(
                Etudiant.mention_id.in_(enseignant_mentions_ids))

        # Filtrer par matière (relation many-to-many)
        if matiere_id:
            query = query.join(etudiant_matieres_v2).filter(
                etudiant_matieres_v2.c.matiere_id == matiere_id
            )
        elif enseignant_matieres_ids:
            query = query.join(etudiant_matieres_v2).filter(
                etudiant_matieres_v2.c.matiere_id.in_(enseignant_matieres_ids)
            )

        # Filtrer par année scolaire si spécifié
        if annee_scolaire and matiere_id:
            query = query.filter(
                etudiant_matieres_v2.c.annee_scolaire == annee_scolaire)

        # Dédoublonner et compter
        query = query.distinct()
        total = query.count()

        # Pagination
        start = (page - 1) * per_page
        etudiants = query.offset(start).limit(per_page).all()

        # Formater les résultats
        etudiants_data = []
        for etudiant in etudiants:
            etudiant_dict = etudiant.to_dict()
            # Ajouter des informations supplémentaires
            if etudiant.user:
                etudiant_dict['nom'] = etudiant.user.name
                etudiant_dict['email'] = etudiant.user.email
            if etudiant.niveau:
                etudiant_dict['niveau'] = etudiant.niveau.to_dict()
            if etudiant.mention:
                etudiant_dict['mention'] = etudiant.mention.to_dict()
            if etudiant.parcours:
                etudiant_dict['parcours'] = etudiant.parcours.to_dict()
            if etudiant.etablissement:
                etudiant_dict['etablissement'] = etudiant.etablissement.to_dict()
            
            # Ajouter les matières de l'étudiant
            etudiant_dict['matieres'] = [m.to_dict() for m in etudiant.matieres]

            etudiants_data.append(etudiant_dict)

        return {
            'items': etudiants_data,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page if per_page > 0 else 0
        }

    def get_statistiques(self, enseignant_id: str) -> Dict[str, Any]:
        """
        Récupère les statistiques complètes d'un enseignant
        incluant le taux de réussite global
        """
        enseignant = self.enseignant_repo.get_by_id(enseignant_id)
        if not enseignant:
            raise ValueError(f"Enseignant {enseignant_id} non trouvé")

        # Récupérer l'utilisateur associé
        user = self.user_repo.get_by_id(enseignant.user_id)
        if not user:
            raise ValueError(
                f"Utilisateur associé à l'enseignant {enseignant_id} non trouvé")

        # Récupérer tous les QCMs de l'enseignant (utiliser l'user_id)
        qcms = self.qcm_repo.get_by_createur(user.id)
        qcms_publies = [q for q in qcms if q.status == 'published']
        qcms_brouillon = [q for q in qcms if q.status == 'draft']

        # Récupérer toutes les sessions de l'enseignant (utiliser l'user_id comme createur_id)
        sessions = self.session_repo.get_by_createur(user.id)
        sessions_actives = [s for s in sessions if s.status == 'en_cours']
        sessions_programmees = [
            s for s in sessions if s.status == 'programmee']
        sessions_terminees = [s for s in sessions if s.status == 'terminee']

        # Calculer le taux de réussite global
        taux_reussite = 0.0
        total_resultats = 0
        resultats_reussis = 0

        # Pour chaque session terminée, récupérer les résultats
        for session in sessions_terminees:
            resultats = self.resultat_repo.get_by_session(session.id)
            resultats_termines = [
                r for r in resultats if r.status == 'termine']

            for resultat in resultats_termines:
                total_resultats += 1
                if resultat.est_reussi:
                    resultats_reussis += 1

        # Calculer le taux de réussite en pourcentage
        if total_resultats > 0:
            taux_reussite = round(
                (resultats_reussis / total_resultats) * 100, 1)

        # Récupérer le nombre d'étudiants liés (via les critères communs)
        # On utilise un ensemble pour éviter les doublons
        etudiants_ids = set()
        from app.models.etudiant import Etudiant

        # Récupérer les critères de l'enseignant
        enseignant_niveaux_ids = [n.id for n in enseignant.niveaux]
        enseignant_parcours_ids = [p.id for p in enseignant.parcours]
        enseignant_mentions_ids = [m.id for m in enseignant.mentions]

        # Compter les étudiants qui partagent au moins un critère
        if enseignant_niveaux_ids or enseignant_parcours_ids or enseignant_mentions_ids:
            query = db.session.query(Etudiant).filter(Etudiant.actif == True)

            if enseignant_niveaux_ids:
                etudiants_niveau = query.filter(
                    Etudiant.niveau_id.in_(enseignant_niveaux_ids)).all()
                for e in etudiants_niveau:
                    etudiants_ids.add(e.id)

            if enseignant_parcours_ids:
                etudiants_parcours = query.filter(
                    Etudiant.parcours_id.in_(enseignant_parcours_ids)).all()
                for e in etudiants_parcours:
                    etudiants_ids.add(e.id)

            if enseignant_mentions_ids:
                etudiants_mention = query.filter(
                    Etudiant.mention_id.in_(enseignant_mentions_ids)).all()
                for e in etudiants_mention:
                    etudiants_ids.add(e.id)

        return {
            'total_qcms': len(qcms),
            'qcms_publies': len(qcms_publies),
            'qcms_brouillon': len(qcms_brouillon),
            'total_sessions': len(sessions),
            'sessions_actives': len(sessions_actives),
            'sessions_programmees': len(sessions_programmees),
            'sessions_terminees': len(sessions_terminees),
            'total_etudiants': len(etudiants_ids),
            'taux_reussite': taux_reussite,
            'total_resultats': total_resultats,
            'resultats_reussis': resultats_reussis
        }
