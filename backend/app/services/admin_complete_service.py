"""
Service complet pour l'administration du système
"""
from typing import Dict, Any, Optional, Tuple, List
from app.repositories.user_repository import UserRepository
from app.repositories.niveau_repository import NiveauRepository
from app.repositories.matiere_repository import MatiereRepository
from app.repositories.classe_repository import ClasseRepository
from app.repositories.qcm_repository import QCMRepository
from app.repositories.session_examen_repository import SessionExamenRepository
from app.repositories.resultat_repository import ResultatRepository
from app.models.user import User, UserRole
from app.models.associations import (
    etudiant_niveaux, etudiant_classes, etudiant_matieres,
    professeur_matieres, professeur_niveaux, professeur_classes
)
from app import db
from datetime import datetime


class AdminCompleteService:
    """Service complet pour l'administration"""

    def __init__(self):
        self.user_repo = UserRepository()
        self.niveau_repo = NiveauRepository()
        self.matiere_repo = MatiereRepository()
        self.classe_repo = ClasseRepository()
        self.qcm_repo = QCMRepository()
        self.session_repo = SessionExamenRepository()
        self.resultat_repo = ResultatRepository()

    # ========================
    # Gestion des Étudiants
    # ========================

    def get_all_etudiants(self, filters: Optional[Dict] = None, skip: int = 0, 
                          limit: int = 100, sort_by: str = 'created_at', 
                          sort_order: str = 'desc') -> Tuple[List[Dict], int]:
        """Récupère tous les étudiants avec pagination"""
        filters = filters or {}
        filters['role'] = 'etudiant'
        users, total = self.user_repo.get_all_paginated(
            skip=skip, limit=limit, filters=filters, 
            sort_by=sort_by, sort_order=sort_order
        )
        return [u.to_dict(include_relations=True) for u in users], total

    def get_etudiant_by_id(self, etudiant_id: str) -> Optional[Dict]:
        """Récupère un étudiant par son ID"""
        user = self.user_repo.get_by_id(etudiant_id)
        if user and user.role == UserRole.ETUDIANT:
            return user.to_dict(include_relations=True)
        return None

    def create_etudiant(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un nouvel étudiant"""
        # Vérifier email unique
        if self.user_repo.get_by_email(data['email']):
            raise ValueError("Cet email est déjà utilisé")

        # Créer l'utilisateur
        user = User(
            email=data['email'],
            name=data['name'],
            role=UserRole.ETUDIANT,
            numero_etudiant=data.get('numero_etudiant'),
            telephone=data.get('telephone'),
            date_naissance=data.get('date_naissance'),
            email_verified=True
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        # Assigner les niveaux, classes et matières si fournis
        annee = data.get('annee_scolaire', f"{datetime.now().year}-{datetime.now().year + 1}")
        
        if data.get('niveau_ids'):
            self._assign_niveaux_to_etudiant(user, data['niveau_ids'], annee)
        if data.get('classe_ids'):
            self._assign_classes_to_etudiant(user, data['classe_ids'], annee)
        if data.get('matiere_ids'):
            self._assign_matieres_to_etudiant(user, data['matiere_ids'], annee)

        db.session.commit()
        db.session.refresh(user)
        
        # Construire manuellement le dict pour éviter les problèmes avec AppenderQuery
        result = user.to_dict(include_relations=False)
        if data.get('niveau_ids') or data.get('classe_ids') or data.get('matiere_ids'):
            result['niveaux'] = []
            result['classes'] = []
            result['matieres'] = []
            
        return result

    def update_etudiant(self, etudiant_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour un étudiant"""
        user = self.user_repo.get_by_id(etudiant_id)
        if not user or user.role != UserRole.ETUDIANT:
            raise ValueError("Étudiant non trouvé")

        # Mettre à jour les champs
        if 'email' in data and data['email'] != user.email:
            if self.user_repo.get_by_email(data['email']):
                raise ValueError("Cet email est déjà utilisé")
            user.email = data['email']

        if 'name' in data:
            user.name = data['name']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        if 'numero_etudiant' in data:
            user.numero_etudiant = data['numero_etudiant']
        if 'telephone' in data:
            user.telephone = data['telephone']
        if 'date_naissance' in data:
            user.date_naissance = data['date_naissance']
        if 'email_verified' in data:
            user.email_verified = data['email_verified']

        db.session.commit()
        return user.to_dict(include_relations=True)

    def delete_etudiant(self, etudiant_id: str) -> bool:
        """Supprime un étudiant"""
        user = self.user_repo.get_by_id(etudiant_id)
        if not user or user.role != UserRole.ETUDIANT:
            raise ValueError("Étudiant non trouvé")
        
        db.session.delete(user)
        db.session.commit()
        return True

    def assign_etudiant(self, etudiant_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Assigne des niveaux/classes/matières à un étudiant"""
        user = self.user_repo.get_by_id(etudiant_id)
        if not user or user.role != UserRole.ETUDIANT:
            raise ValueError("Étudiant non trouvé")

        annee = data['annee_scolaire']

        if data.get('niveau_ids') is not None:
            # Supprimer les anciennes assignations
            db.session.execute(
                etudiant_niveaux.delete().where(etudiant_niveaux.c.etudiant_id == etudiant_id)
            )
            self._assign_niveaux_to_etudiant(user, data['niveau_ids'], annee)

        if data.get('classe_ids') is not None:
            db.session.execute(
                etudiant_classes.delete().where(etudiant_classes.c.etudiant_id == etudiant_id)
            )
            self._assign_classes_to_etudiant(user, data['classe_ids'], annee)

        if data.get('matiere_ids') is not None:
            db.session.execute(
                etudiant_matieres.delete().where(etudiant_matieres.c.etudiant_id == etudiant_id)
            )
            self._assign_matieres_to_etudiant(user, data['matiere_ids'], annee)

        db.session.commit()
        db.session.refresh(user)
        
        # Construire manuellement le dict pour éviter les problèmes avec AppenderQuery
        result = user.to_dict(include_relations=False)
        result['niveaux'] = []
        result['classes'] = []
        result['matieres'] = []
        
        return result

    def _assign_niveaux_to_etudiant(self, user: User, niveau_ids: List[str], annee: str):
        """Assigne des niveaux à un étudiant"""
        for niveau_id in niveau_ids:
            niveau = self.niveau_repo.get_by_id(niveau_id)
            if niveau:
                db.session.execute(
                    etudiant_niveaux.insert().values(
                        etudiant_id=user.id,
                        niveau_id=niveau_id,
                        annee_scolaire=annee,
                        est_actuel=True
                    )
                )

    def _assign_classes_to_etudiant(self, user: User, classe_ids: List[str], annee: str):
        """Assigne des classes à un étudiant"""
        for classe_id in classe_ids:
            classe = self.classe_repo.get_by_id(classe_id)
            if classe:
                db.session.execute(
                    etudiant_classes.insert().values(
                        etudiant_id=user.id,
                        classe_id=classe_id,
                        annee_scolaire=annee,
                        est_actuelle=True
                    )
                )

    def _assign_matieres_to_etudiant(self, user: User, matiere_ids: List[str], annee: str):
        """Assigne des matières à un étudiant"""
        for matiere_id in matiere_ids:
            matiere = self.matiere_repo.get_by_id(matiere_id)
            if matiere:
                db.session.execute(
                    etudiant_matieres.insert().values(
                        etudiant_id=user.id,
                        matiere_id=matiere_id,
                        annee_scolaire=annee,
                        est_actuelle=True
                    )
                )

    # ========================
    # Gestion des Professeurs
    # ========================

    def get_all_professeurs(self, filters: Optional[Dict] = None, skip: int = 0,
                            limit: int = 100, sort_by: str = 'created_at',
                            sort_order: str = 'desc') -> Tuple[List[Dict], int]:
        """Récupère tous les professeurs avec pagination"""
        filters = filters or {}
        filters['role'] = 'enseignant'
        users, total = self.user_repo.get_all_paginated(
            skip=skip, limit=limit, filters=filters,
            sort_by=sort_by, sort_order=sort_order
        )
        return [u.to_dict(include_relations=True) for u in users], total

    def get_professeur_by_id(self, professeur_id: str) -> Optional[Dict]:
        """Récupère un professeur par son ID"""
        user = self.user_repo.get_by_id(professeur_id)
        if user and (user.role == UserRole.ENSEIGNANT or user.role == UserRole.PROFESSEUR):
            return user.to_dict(include_relations=True)
        return None

    def create_professeur(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Crée un nouveau professeur"""
        if self.user_repo.get_by_email(data['email']):
            raise ValueError("Cet email est déjà utilisé")

        user = User(
            email=data['email'],
            name=data['name'],
            role=UserRole.ENSEIGNANT,
            numero_enseignant=data.get('numero_enseignant'),
            telephone=data.get('telephone'),
            email_verified=True
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.flush()

        # Assigner les matières, niveaux et classes
        annee = data.get('annee_scolaire', f"{datetime.now().year}-{datetime.now().year + 1}")

        if data.get('matiere_ids'):
            self._assign_matieres_to_professeur(user, data['matiere_ids'], annee)
        if data.get('niveau_ids'):
            self._assign_niveaux_to_professeur(user, data['niveau_ids'])
        if data.get('classe_ids'):
            self._assign_classes_to_professeur(user, data['classe_ids'], annee)

        db.session.commit()
        return user.to_dict(include_relations=True)

    def update_professeur(self, professeur_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour un professeur"""
        user = self.user_repo.get_by_id(professeur_id)
        if not user or user.role not in [UserRole.ENSEIGNANT, UserRole.PROFESSEUR]:
            raise ValueError("Professeur non trouvé")

        if 'email' in data and data['email'] != user.email:
            if self.user_repo.get_by_email(data['email']):
                raise ValueError("Cet email est déjà utilisé")
            user.email = data['email']

        if 'name' in data:
            user.name = data['name']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        if 'numero_enseignant' in data:
            user.numero_enseignant = data['numero_enseignant']
        if 'telephone' in data:
            user.telephone = data['telephone']
        if 'email_verified' in data:
            user.email_verified = data['email_verified']

        db.session.commit()
        return user.to_dict(include_relations=True)

    def delete_professeur(self, professeur_id: str) -> bool:
        """Supprime un professeur"""
        user = self.user_repo.get_by_id(professeur_id)
        if not user or user.role not in [UserRole.ENSEIGNANT, UserRole.PROFESSEUR]:
            raise ValueError("Professeur non trouvé")

        db.session.delete(user)
        db.session.commit()
        return True

    def assign_professeur(self, professeur_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Assigne des matières/niveaux/classes à un professeur"""
        user = self.user_repo.get_by_id(professeur_id)
        if not user or user.role not in [UserRole.ENSEIGNANT, UserRole.PROFESSEUR]:
            raise ValueError("Professeur non trouvé")

        annee = data.get('annee_scolaire', f"{datetime.now().year}-{datetime.now().year + 1}")

        if data.get('matiere_ids') is not None:
            db.session.execute(
                professeur_matieres.delete().where(professeur_matieres.c.professeur_id == professeur_id)
            )
            self._assign_matieres_to_professeur(user, data['matiere_ids'], annee)

        if data.get('niveau_ids') is not None:
            db.session.execute(
                professeur_niveaux.delete().where(professeur_niveaux.c.professeur_id == professeur_id)
            )
            self._assign_niveaux_to_professeur(user, data['niveau_ids'])

        if data.get('classe_ids') is not None:
            db.session.execute(
                professeur_classes.delete().where(professeur_classes.c.professeur_id == professeur_id)
            )
            self._assign_classes_to_professeur(user, data['classe_ids'], annee)

        db.session.commit()
        return user.to_dict(include_relations=True)

    def _assign_matieres_to_professeur(self, user: User, matiere_ids: List[str], annee: str):
        """Assigne des matières à un professeur"""
        for matiere_id in matiere_ids:
            matiere = self.matiere_repo.get_by_id(matiere_id)
            if matiere:
                db.session.execute(
                    professeur_matieres.insert().values(
                        professeur_id=user.id,
                        matiere_id=matiere_id,
                        annee_scolaire=annee
                    )
                )

    def _assign_niveaux_to_professeur(self, user: User, niveau_ids: List[str]):
        """Assigne des niveaux à un professeur"""
        for niveau_id in niveau_ids:
            niveau = self.niveau_repo.get_by_id(niveau_id)
            if niveau:
                db.session.execute(
                    professeur_niveaux.insert().values(
                        professeur_id=user.id,
                        niveau_id=niveau_id
                    )
                )

    def _assign_classes_to_professeur(self, user: User, classe_ids: List[str], annee: str):
        """Assigne des classes à un professeur"""
        for classe_id in classe_ids:
            classe = self.classe_repo.get_by_id(classe_id)
            if classe:
                db.session.execute(
                    professeur_classes.insert().values(
                        professeur_id=user.id,
                        classe_id=classe_id,
                        annee_scolaire=annee
                    )
                )

    # ========================
    # Affectation Matière -> Professeurs
    # ========================

    def assign_professeurs_to_matiere(self, matiere_id: str, professeur_ids: List[str], 
                                       annee_scolaire: Optional[str] = None) -> Dict:
        """Affecte des professeurs à une matière"""
        matiere = self.matiere_repo.get_by_id(matiere_id)
        if not matiere:
            raise ValueError("Matière non trouvée")

        annee = annee_scolaire or f"{datetime.now().year}-{datetime.now().year + 1}"

        # Supprimer les anciennes affectations
        db.session.execute(
            professeur_matieres.delete().where(professeur_matieres.c.matiere_id == matiere_id)
        )

        # Ajouter les nouvelles
        for prof_id in professeur_ids:
            user = self.user_repo.get_by_id(prof_id)
            if user and user.role in [UserRole.ENSEIGNANT, UserRole.PROFESSEUR]:
                db.session.execute(
                    professeur_matieres.insert().values(
                        professeur_id=prof_id,
                        matiere_id=matiere_id,
                        annee_scolaire=annee
                    )
                )

        db.session.commit()

        # Récupérer la liste mise à jour des professeurs
        professeurs = []
        for prof_id in professeur_ids:
            prof = self.user_repo.get_by_id(prof_id)
            if prof:
                professeurs.append({
                    'id': prof.id,
                    'name': prof.name,
                    'email': prof.email
                })

        return {
            'matiere': matiere.to_dict(),
            'professeurs': professeurs,
            'anneeScolaire': annee
        }

    def get_professeurs_by_matiere(self, matiere_id: str) -> List[Dict]:
        """Récupère les professeurs affectés à une matière"""
        matiere = self.matiere_repo.get_by_id(matiere_id)
        if not matiere:
            raise ValueError("Matière non trouvée")

        # Requête pour récupérer les professeurs
        result = db.session.execute(
            db.select(User).join(
                professeur_matieres,
                User.id == professeur_matieres.c.professeur_id
            ).where(professeur_matieres.c.matiere_id == matiere_id)
        ).scalars().all()

        return [u.to_dict(include_relations=True) for u in result]

    # ========================
    # Gestion Sessions Examen (Admin)
    # ========================

    def get_all_sessions_admin(self, filters: Optional[Dict] = None, skip: int = 0,
                                limit: int = 100) -> Tuple[List[Dict], int]:
        """Récupère toutes les sessions (accès admin, pas de filtre créateur)"""
        sessions, total = self.session_repo.get_all_paginated(
            skip=skip, limit=limit, filters=filters
        )
        return [s.to_dict() for s in sessions], total

    def update_session_admin(self, session_id: str, data: Dict[str, Any]) -> Dict:
        """Met à jour une session (accès admin complet)"""
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        # Mettre à jour tous les champs autorisés
        updatable_fields = [
            'titre', 'description', 'date_debut', 'date_fin', 'duree_minutes',
            'tentatives_max', 'melange_questions', 'melange_options',
            'afficher_correction', 'note_passage', 'status', 'qcm_id', 'classe_id'
        ]

        for field in updatable_fields:
            if field in data:
                setattr(session, field, data[field])

        db.session.commit()
        return session.to_dict()

    def delete_session_admin(self, session_id: str) -> bool:
        """Supprime une session (accès admin)"""
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        db.session.delete(session)
        db.session.commit()
        return True

    # ========================
    # Gestion Résultats (Admin)
    # ========================

    def get_all_resultats_admin(self, filters: Optional[Dict] = None, skip: int = 0,
                                 limit: int = 100) -> Tuple[List[Dict], int]:
        """Récupère tous les résultats (accès admin)"""
        resultats, total = self.resultat_repo.get_all_paginated(
            skip=skip, limit=limit, filters=filters
        )
        return [r.to_dict(include_details=True) for r in resultats], total

    def update_resultat_admin(self, resultat_id: str, data: Dict[str, Any]) -> Dict:
        """Met à jour un résultat (accès admin pour validation/invalidation)"""
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError("Résultat non trouvé")

        # Champs modifiables par admin
        if 'est_valide' in data:
            resultat.est_valide = data['est_valide']
        if 'commentaire_prof' in data:
            resultat.commentaire_prof = data['commentaire_prof']
        if 'note_prof' in data:
            resultat.note_prof = data['note_prof']
        if 'status' in data:
            resultat.status = data['status']

        db.session.commit()
        return resultat.to_dict(include_details=True)

    def delete_resultat_admin(self, resultat_id: str) -> bool:
        """Supprime un résultat (accès admin)"""
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError("Résultat non trouvé")

        db.session.delete(resultat)
        db.session.commit()
        return True

    def get_resultats_stats_global(self) -> Dict:
        """Récupère les statistiques globales des résultats"""
        from sqlalchemy import func
        from app.models.resultat import Resultat

        total = db.session.query(func.count(Resultat.id)).scalar()
        termines = db.session.query(func.count(Resultat.id)).filter(
            Resultat.status == 'termine'
        ).scalar()
        reussis = db.session.query(func.count(Resultat.id)).filter(
            Resultat.est_reussi == True
        ).scalar()
        moyenne = db.session.query(func.avg(Resultat.note_sur_20)).filter(
            Resultat.status == 'termine'
        ).scalar()

        return {
            'total': total,
            'termines': termines,
            'reussis': reussis,
            'taux_reussite': (reussis / termines * 100) if termines > 0 else 0,
            'moyenne_generale': round(moyenne, 2) if moyenne else 0
        }

