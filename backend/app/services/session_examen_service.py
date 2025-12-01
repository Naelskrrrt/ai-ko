"""
Service pour la gestion des Sessions d'Examen avec logique métier
"""
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from app.repositories.session_examen_repository import SessionExamenRepository
from app.repositories.qcm_repository import QCMRepository
from app.repositories.classe_repository import ClasseRepository
from app.repositories.user_repository import UserRepository
from app.models.session_examen import SessionExamen
from app.models.user import UserRole


class SessionExamenService:
    """Service pour la gestion des Sessions d'Examen"""

    def __init__(self):
        self.session_repo = SessionExamenRepository()
        self.qcm_repo = QCMRepository()
        self.classe_repo = ClasseRepository()
        self.user_repo = UserRepository()

    def get_all_sessions(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], int]:
        """Récupère toutes les sessions avec pagination"""
        sessions, total = self.session_repo.get_all_paginated(
            skip=skip, limit=limit, filters=filters)
        return [session.to_dict() for session in sessions], total

    def get_session_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Récupère une session par son ID"""
        session = self.session_repo.get_by_id(session_id)
        return session.to_dict() if session else None

    def get_sessions_by_qcm(self, qcm_id: str) -> List[Dict[str, Any]]:
        """Récupère les sessions d'un QCM"""
        sessions = self.session_repo.get_by_qcm(qcm_id)
        return [session.to_dict() for session in sessions]

    def get_sessions_by_classe(self, classe_id: str) -> List[Dict[str, Any]]:
        """Récupère les sessions d'une classe"""
        sessions = self.session_repo.get_by_classe(classe_id)
        return [session.to_dict() for session in sessions]

    def get_sessions_disponibles(self, etudiant_id: str) -> List[Dict[str, Any]]:
        """Récupère les sessions disponibles pour un étudiant"""
        sessions = self.session_repo.get_disponibles_etudiant(etudiant_id)
        return [session.to_dict() for session in sessions]

    def get_sessions_disponibles_format(self, etudiant_id: str) -> List[Dict[str, Any]]:
        """
        Récupère les sessions disponibles formatées pour le frontend (format Examen[])
        Inclut les sessions programmées (actuelles et futures), en cours, et terminées récemment
        """
        from app.repositories.resultat_repository import ResultatRepository
        from datetime import datetime, timedelta
        from sqlalchemy import and_, or_

        now = datetime.utcnow()
        resultat_repo = ResultatRepository()
        
        # Récupérer les sessions disponibles (programmées ou en cours)
        # La date de début n'est plus une restriction - seule la date de fin (limite de soumission) compte
        sessions_disponibles = self.session_repo.get_disponibles_etudiant(etudiant_id)
        
        # Plus besoin de récupérer séparément les sessions futures car elles sont déjà incluses
        # dans get_disponibles_etudiant si leur date_fin n'est pas passée
        
        # Récupérer les sessions terminées récemment (30 derniers jours) pour l'historique
        date_limite = now - timedelta(days=30)
        sessions_terminees = self.session_repo.session.query(SessionExamen).filter(
            and_(
                SessionExamen.status == 'terminee',
                SessionExamen.date_fin >= date_limite
            )
        ).order_by(SessionExamen.date_fin.desc()).all()
        
        # Combiner les sessions disponibles et terminées (sans doublons)
        sessions_ids = {s.id for s in sessions_disponibles}
        sessions = list(sessions_disponibles)
        for s in sessions_terminees:
            if s.id not in sessions_ids:
                sessions.append(s)
                sessions_ids.add(s.id)

        examens_formates = []
        for session in sessions:
            # Récupérer le QCM
            qcm = self.qcm_repo.get_by_id(session.qcm_id)
            if not qcm:
                continue

            # Compter les questions
            nombre_questions = len(qcm.questions) if qcm.questions else 0
            total_points = sum(
                [q.points for q in qcm.questions]) if qcm.questions else 0

            # Compter les tentatives
            nb_tentatives = resultat_repo.count_tentatives(
                etudiant_id, session.id)
            # NOTE: tentatives_restantes désactivé temporairement (pas de limite)
            tentatives_restantes = 999  # Valeur arbitraire élevée pour indiquer "illimité"

            # Déterminer le statut
            # Vérifier d'abord si la session est terminée
            if session.status == 'terminee':
                statut = 'termine'
            else:
                # Vérifier les résultats de l'étudiant pour cette session
                resultats_etudiant = resultat_repo.get_by_etudiant(etudiant_id)
                resultats_session = [r for r in resultats_etudiant if r.session_id == session.id]
                
                # Vérifier s'il y a un résultat terminé (priorité)
                resultat_termine = next(
                    (r for r in resultats_session if r.status == 'termine'), None)
                
                if resultat_termine:
                    statut = 'termine'
                else:
                    # Vérifier s'il y a un résultat en cours
                    resultat_en_cours = next(
                        (r for r in resultats_session if r.status == 'en_cours'), None)
                    
                    if resultat_en_cours:
                        statut = 'en_cours'
                    else:
                        statut = 'disponible'  # Session disponible (peut être démarrée)

            # Récupérer le niveau depuis la classe si disponible
            niveau = 'Non spécifié'
            if session.classe and session.classe.niveau:
                niveau = session.classe.niveau.nom

            examen_formate = {
                'id': session.id,
                'titre': session.titre,
                'description': session.description,
                'matiere': qcm.matiere if qcm else 'Non spécifiée',
                'niveau': niveau,
                'dateDebut': session.date_debut.isoformat() if session.date_debut else None,
                'dateFin': session.date_fin.isoformat() if session.date_fin else None,
                'dureeMinutes': session.duree_minutes,
                'nombreQuestions': nombre_questions,
                'totalPoints': total_points,
                'statut': statut,
                'tentatives_restantes': max(0, tentatives_restantes),
                'qcm': {
                    'id': qcm.id,
                    'titre': qcm.titre,
                    'matiere': qcm.matiere
                } if qcm else None,
                'classe': {
                    'id': session.classe.id,
                    'code': session.classe.code,
                    'nom': session.classe.nom,
                    'niveau': {
                        'nom': session.classe.niveau.nom
                    } if session.classe.niveau else None
                } if session.classe else None
            }

            examens_formates.append(examen_formate)

        return examens_formates

    def create_session(self, data: Dict[str, Any], createur_id: str) -> Dict[str, Any]:
        """
        Crée une nouvelle session d'examen avec validations

        Validations:
        - Titre: 3-255 caractères
        - QCM: doit exister
        - Dates: date_debut < date_fin
        - Durée: entre 1 et 999 minutes
        - Tentatives max: entre 1 et 10
        - Note de passage: entre 0 et 20
        """
        # Validation créateur
        createur = self.user_repo.get_by_id(createur_id)
        if not createur:
            raise ValueError("Créateur non trouvé")

        if createur.role not in [UserRole.ENSEIGNANT, UserRole.ADMIN]:
            raise ValueError(
                "Seuls les enseignants et administrateurs peuvent créer des sessions")

        # Validation titre
        titre = data.get('titre', '').strip()
        if len(titre) < 3 or len(titre) > 255:
            raise ValueError(
                "Le titre doit contenir entre 3 et 255 caractères")

        # Validation QCM
        qcm_id = data.get('qcm_id')
        if not qcm_id:
            raise ValueError("Le QCM est requis")

        qcm = self.qcm_repo.get_by_id(qcm_id)
        if not qcm:
            raise ValueError("QCM non trouvé")

        # Validation classe (optionnel)
        classe_id = data.get('classe_id')
        if classe_id:
            classe = self.classe_repo.get_by_id(classe_id)
            if not classe:
                raise ValueError("Classe non trouvée")

        # Validation dates
        try:
            date_debut = datetime.fromisoformat(
                data['date_debut'].replace('Z', '+00:00'))
            date_fin = datetime.fromisoformat(
                data['date_fin'].replace('Z', '+00:00'))
        except (ValueError, KeyError) as e:
            raise ValueError(f"Format de date invalide: {str(e)}")

        if date_debut >= date_fin:
            raise ValueError(
                "La date de début doit être antérieure à la date de fin")

        # Validation durée
        duree_minutes = data.get('duree_minutes')
        if not duree_minutes:
            raise ValueError("La durée est requise")

        try:
            duree_minutes = int(duree_minutes)
            if duree_minutes < 1 or duree_minutes > 999:
                raise ValueError("La durée doit être entre 1 et 999 minutes")
        except (ValueError, TypeError):
            raise ValueError("La durée doit être un nombre entier")

        # Validation tentatives_max
        tentatives_max = data.get('tentatives_max', 1)
        try:
            tentatives_max = int(tentatives_max)
            if tentatives_max < 1 or tentatives_max > 10:
                raise ValueError(
                    "Le nombre de tentatives doit être entre 1 et 10")
        except (ValueError, TypeError):
            raise ValueError(
                "Le nombre de tentatives doit être un nombre entier")

        # Validation note_passage
        note_passage = data.get('note_passage', 10.0)
        try:
            note_passage = float(note_passage)
            if note_passage < 0 or note_passage > 20:
                raise ValueError("La note de passage doit être entre 0 et 20")
        except (ValueError, TypeError):
            raise ValueError("La note de passage doit être un nombre")

        # Validation description (optionnelle)
        description = data.get('description', '').strip(
        ) if data.get('description') else None
        if description and len(description) > 5000:
            raise ValueError(
                "La description ne peut pas dépasser 5000 caractères")

        # Validation niveau_id, mention_id, parcours_id (optionnels)
        niveau_id = data.get('niveau_id') or data.get('niveauId')
        mention_id = data.get('mention_id') or data.get('mentionId')
        parcours_id = data.get('parcours_id') or data.get('parcoursId')
        
        if niveau_id:
            from app.repositories.niveau_repository import NiveauRepository
            niveau_repo = NiveauRepository()
            # Accepter soit un ID (UUID) soit un code (L1, L2, etc.)
            niveau_obj = niveau_repo.get_by_id(niveau_id)
            if not niveau_obj:
                # Si ce n'est pas un ID, essayer comme code
                niveau_obj = niveau_repo.get_by_code(niveau_id)
            if not niveau_obj:
                raise ValueError(f"Niveau avec l'ID ou code {niveau_id} non trouvé")
            niveau_id = niveau_obj.id  # Utiliser l'ID réel
        
        if mention_id:
            from app.repositories.mention_repository import MentionRepository
            mention_repo = MentionRepository()
            mention_obj = mention_repo.get_by_id(mention_id)
            if not mention_obj:
                raise ValueError(f"Mention avec l'ID {mention_id} non trouvée")
        
        if parcours_id:
            from app.repositories.parcours_repository import ParcoursRepository
            parcours_repo = ParcoursRepository()
            parcours_obj = parcours_repo.get_by_id(parcours_id)
            if not parcours_obj:
                raise ValueError(f"Parcours avec l'ID {parcours_id} non trouvé")

        # Créer la session
        session = SessionExamen(
            titre=titre,
            description=description,
            date_debut=date_debut,
            date_fin=date_fin,
            duree_minutes=duree_minutes,
            tentatives_max=tentatives_max,
            melange_questions=data.get('melange_questions', True),
            melange_options=data.get('melange_options', True),
            afficher_correction=data.get('afficher_correction', True),
            note_passage=note_passage,
            status=data.get('status', 'programmee'),
            qcm_id=qcm_id,
            classe_id=classe_id,
            niveau_id=niveau_id,
            mention_id=mention_id,
            parcours_id=parcours_id,
            createur_id=createur_id
        )

        session = self.session_repo.create(session)
        return session.to_dict()

    def update_session(self, session_id: str, data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Met à jour une session d'examen"""
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        # Vérification des permissions
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user and user.role != UserRole.ADMIN and session.createur_id != user_id:
                raise ValueError(
                    "Vous n'avez pas la permission de modifier cette session")

        # Validation titre
        if 'titre' in data:
            titre = data['titre'].strip()
            if len(titre) < 3 or len(titre) > 255:
                raise ValueError(
                    "Le titre doit contenir entre 3 et 255 caractères")
            session.titre = titre

        # Validation dates
        if 'date_debut' in data or 'date_fin' in data:
            try:
                date_debut = session.date_debut
                date_fin = session.date_fin

                if 'date_debut' in data:
                    date_debut = datetime.fromisoformat(
                        data['date_debut'].replace('Z', '+00:00'))

                if 'date_fin' in data:
                    date_fin = datetime.fromisoformat(
                        data['date_fin'].replace('Z', '+00:00'))

                if date_debut >= date_fin:
                    raise ValueError(
                        "La date de début doit être antérieure à la date de fin")

                session.date_debut = date_debut
                session.date_fin = date_fin
            except ValueError as e:
                raise ValueError(f"Format de date invalide: {str(e)}")

        # Validation durée
        if 'duree_minutes' in data:
            try:
                duree_minutes = int(data['duree_minutes'])
                if duree_minutes < 1 or duree_minutes > 999:
                    raise ValueError(
                        "La durée doit être entre 1 et 999 minutes")
                session.duree_minutes = duree_minutes
            except (ValueError, TypeError):
                raise ValueError("La durée doit être un nombre entier")

        # Validation tentatives_max
        if 'tentatives_max' in data:
            try:
                tentatives_max = int(data['tentatives_max'])
                if tentatives_max < 1 or tentatives_max > 10:
                    raise ValueError(
                        "Le nombre de tentatives doit être entre 1 et 10")
                session.tentatives_max = tentatives_max
            except (ValueError, TypeError):
                raise ValueError(
                    "Le nombre de tentatives doit être un nombre entier")

        # Validation note_passage
        if 'note_passage' in data:
            try:
                note_passage = float(data['note_passage'])
                if note_passage < 0 or note_passage > 20:
                    raise ValueError(
                        "La note de passage doit être entre 0 et 20")
                session.note_passage = note_passage
            except (ValueError, TypeError):
                raise ValueError("La note de passage doit être un nombre")

        # Autres champs
        if 'description' in data:
            description = data['description'].strip(
            ) if data['description'] else None
            if description and len(description) > 5000:
                raise ValueError(
                    "La description ne peut pas dépasser 5000 caractères")
            session.description = description

        if 'melange_questions' in data:
            session.melange_questions = bool(data['melange_questions'])

        if 'melange_options' in data:
            session.melange_options = bool(data['melange_options'])

        if 'afficher_correction' in data:
            session.afficher_correction = bool(data['afficher_correction'])

        if 'status' in data:
            if data['status'] not in ['programmee', 'en_cours', 'en_pause', 'terminee', 'annulee']:
                raise ValueError("Status invalide")
            session.status = data['status']

        session = self.session_repo.update(session)
        return session.to_dict()

    def delete_session(self, session_id: str, user_id: Optional[str] = None) -> bool:
        """Supprime une session d'examen"""
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        # Vérification des permissions
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user and user.role != UserRole.ADMIN and session.createur_id != user_id:
                raise ValueError(
                    "Vous n'avez pas la permission de supprimer cette session")

        return self.session_repo.delete(session)

    def demarrer_session(self, session_id: str) -> Dict[str, Any]:
        """Démarre une session (change le statut en 'en_cours')"""
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        if session.status not in ['programmee', 'en_pause']:
            raise ValueError(
                "Seules les sessions programmées ou en pause peuvent être démarrées")

        session.status = 'en_cours'
        session = self.session_repo.update(session)
        return session.to_dict()

    def terminer_session(self, session_id: str) -> Dict[str, Any]:
        """Termine une session (change le statut en 'terminee')"""
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        if session.status not in ['programmee', 'en_cours', 'en_pause']:
            raise ValueError(
                "Seules les sessions programmées, en cours ou en pause peuvent être terminées")

        session.status = 'terminee'
        session = self.session_repo.update(session)
        return session.to_dict()

    def mettre_en_pause(self, session_id: str) -> Dict[str, Any]:
        """Met une session en pause (change le statut en 'en_pause')"""
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        if session.status != 'en_cours':
            raise ValueError(
                "Seules les sessions en cours peuvent être mises en pause")

        session.status = 'en_pause'
        session = self.session_repo.update(session)
        return session.to_dict()

    def reprendre_session(self, session_id: str) -> Dict[str, Any]:
        """Reprend une session en pause (change le statut en 'en_cours')"""
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        if session.status != 'en_pause':
            raise ValueError(
                "Seules les sessions en pause peuvent être reprises")

        session.status = 'en_cours'
        session = self.session_repo.update(session)
        return session.to_dict()
