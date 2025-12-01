"""
Service pour la gestion des Résultats avec logique métier
"""
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from app.repositories.resultat_repository import ResultatRepository
from app.repositories.session_examen_repository import SessionExamenRepository
from app.repositories.user_repository import UserRepository
from app.repositories.qcm_repository import QCMRepository
from app.models.resultat import Resultat
from app.models.user import UserRole


class ResultatService:
    """Service pour la gestion des Résultats"""

    def __init__(self):
        self.resultat_repo = ResultatRepository()
        self.session_repo = SessionExamenRepository()
        self.user_repo = UserRepository()
        self.qcm_repo = QCMRepository()

    def get_all_resultats(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], int]:
        """Récupère tous les résultats avec pagination"""
        resultats, total = self.resultat_repo.get_all_paginated(
            skip=skip, limit=limit, filters=filters)
        return [resultat.to_dict() for resultat in resultats], total

    def get_resultat_by_id(self, resultat_id: str, include_details: bool = False) -> Optional[Dict[str, Any]]:
        """Récupère un résultat par son ID"""
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"Recherche du résultat avec ID: {resultat_id}")
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            logger.warning(f"Résultat {resultat_id} non trouvé dans la base de données")
            return None
        try:
            return resultat.to_dict(include_details=include_details)
        except Exception as e:
            logger.error(f"Erreur lors de la conversion du résultat en dictionnaire: {e}", exc_info=True)
            raise
    
    def get_resultat_by_session_and_user(self, session_id: str, user_id: str, include_details: bool = False) -> Optional[Dict[str, Any]]:
        """Récupère le résultat le plus récent d'un étudiant pour une session donnée"""
        resultats = self.resultat_repo.get_by_etudiant_and_session(user_id, session_id)
        if not resultats:
            return None
        # Retourner le résultat le plus récent (dernière tentative)
        resultat = max(resultats, key=lambda r: r.numero_tentative)
        return resultat.to_dict(include_details=include_details)

    def get_resultats_by_etudiant(self, etudiant_id: str) -> List[Dict[str, Any]]:
        """Récupère les résultats d'un étudiant"""
        resultats = self.resultat_repo.get_by_etudiant(etudiant_id)
        return [resultat.to_dict() for resultat in resultats]

    def get_resultats_by_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Récupère les résultats d'une session"""
        resultats = self.resultat_repo.get_by_session(session_id)
        
        # S'assurer que tous les résultats terminés ont leurs notes calculées
        for resultat in resultats:
            if resultat.status == 'termine' and (resultat.note_sur_20 is None or resultat.pourcentage is None):
                # Recalculer les notes si manquantes
                if resultat.score_maximum > 0:
                    resultat.pourcentage = (resultat.score_total / resultat.score_maximum) * 100
                    resultat.note_sur_20 = (resultat.score_total / resultat.score_maximum) * 20
                else:
                    resultat.pourcentage = 0
                    resultat.note_sur_20 = 0
                
                # Recalculer est_reussi
                session = self.session_repo.get_by_id(session_id)
                if session and resultat.note_sur_20 is not None:
                    resultat.est_reussi = resultat.note_sur_20 >= session.note_passage
                
                # Sauvegarder les modifications
                self.resultat_repo.update(resultat)
        
        # Trier par note décroissante (du plus haut au plus bas)
        # Les résultats avec note_sur_20 == None sont placés à la fin
        resultats.sort(key=lambda r: (r.note_sur_20 is not None, r.note_sur_20 or 0), reverse=True)
        
        return [resultat.to_dict() for resultat in resultats]

    def get_statistiques_session(self, session_id: str) -> Dict[str, Any]:
        """Récupère les statistiques d'une session"""
        return self.resultat_repo.get_statistiques_session(session_id)

    def get_statistiques_etudiant(self, etudiant_id: str) -> Dict[str, Any]:
        """Récupère les statistiques d'un étudiant"""
        return self.resultat_repo.get_statistiques_etudiant(etudiant_id)

    def get_statistiques_qcm(self, qcm_id: str) -> Dict[str, Any]:
        """Récupère les statistiques complètes d'un QCM"""
        # Vérifier que le QCM existe
        qcm = self.qcm_repo.get_by_id(qcm_id)
        if not qcm:
            raise ValueError(f"QCM {qcm_id} non trouvé")
        
        # Récupérer les statistiques depuis le repository
        stats = self.resultat_repo.get_statistiques_qcm(qcm_id)
        
        # Ajouter des informations sur le QCM
        stats['qcm'] = {
            'id': qcm.id,
            'titre': qcm.titre,
            'nombre_questions': len(qcm.questions) if qcm.questions else 0,
            'duree_minutes': qcm.duree
        }
        
        return stats

    def demarrer_examen(self, session_id: str, etudiant_id: str) -> Dict[str, Any]:
        """
        Démarre un examen pour un étudiant

        Validations:
        - Session existe et est disponible
        - Étudiant n'a pas atteint le nombre max de tentatives
        - Session n'est pas expirée
        """
        # Vérifier session
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        if session.status not in ['programmee', 'en_cours']:
            raise ValueError("Cette session n'est pas disponible")

        # Vérifier uniquement la date de fin (limite de soumission)
        # On permet de démarrer un examen même si la date de début est dans le futur
        now = datetime.utcnow()
        if now > session.date_fin:
            raise ValueError("Cette session est terminée (date limite de soumission dépassée)")

        # Vérifier nombre de tentatives
        # NOTE: Désactivé temporairement - pas de limite de tentatives pour l'instant
        nb_tentatives = self.resultat_repo.count_tentatives(
            etudiant_id, session_id)
        # if nb_tentatives >= session.tentatives_max:
        #     raise ValueError(
        #         f"Vous avez atteint le nombre maximum de tentatives ({session.tentatives_max})")

        # Récupérer le QCM et compter les questions
        qcm = self.qcm_repo.get_by_id(session.qcm_id)
        if not qcm:
            raise ValueError("QCM non trouvé")

        questions_total = len(qcm.questions) if qcm.questions else 0
        if questions_total == 0:
            raise ValueError("Ce QCM ne contient aucune question")

        # Calculer score maximum
        score_maximum = sum([q.points for q in qcm.questions]
                            ) if qcm.questions else 0

        # Créer le résultat
        resultat = Resultat(
            etudiant_id=etudiant_id,
            session_id=session_id,
            qcm_id=session.qcm_id,
            numero_tentative=nb_tentatives + 1,
            date_debut=now,
            questions_total=questions_total,
            score_maximum=score_maximum,
            status='en_cours'
        )

        resultat = self.resultat_repo.create(resultat)
        return resultat.to_dict()

    def demarrer_examen_format(self, session_id: str, etudiant_id: str) -> Dict[str, Any]:
        """
        Démarre un examen et retourne le format StartExamResponse pour le frontend
        """
        from app.repositories.question_repository import QuestionRepository
        import random

        # Démarrer l'examen (crée le résultat)
        resultat_dict = self.demarrer_examen(session_id, etudiant_id)
        resultat_id = resultat_dict['id']

        # Récupérer la session
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError("Session non trouvée")

        # Récupérer le QCM
        qcm = self.qcm_repo.get_by_id(session.qcm_id)
        if not qcm:
            raise ValueError("QCM non trouvé")

        # Récupérer les questions
        question_repo = QuestionRepository()
        questions = question_repo.get_by_qcm(session.qcm_id)

        # Mélanger les questions si configuré
        if session.melange_questions:
            questions = list(questions)
            random.shuffle(questions)

        # Formater les questions pour le frontend
        questions_formatees = []
        for idx, q in enumerate(questions):
            question_dict = q.to_dict()

            # Mélanger les options si configuré et extraire les textes
            options_raw = question_dict.get('options', [])
            if session.melange_options and isinstance(options_raw, list):
                options_raw = list(options_raw)
                random.shuffle(options_raw)

            # Extraire les textes des options (peuvent être des objets ou des strings)
            # IMPORTANT: Ne pas inclure d'information sur les réponses correctes pendant l'examen
            options_textes = []
            if isinstance(options_raw, list):
                for opt in options_raw:
                    if isinstance(opt, str):
                        options_textes.append(opt)
                    elif isinstance(opt, dict):
                        # Extraire SEULEMENT le texte de l'objet, sans estCorrecte
                        texte = opt.get('texte') or opt.get('text') or str(opt)
                        options_textes.append(texte)

            # Formater selon le type frontend
            # IMPORTANT: Ne pas inclure reponseCorrecte ou toute information sur les bonnes réponses
            question_formatee = {
                'id': question_dict['id'],
                'numero': idx + 1,
                'enonce': question_dict['enonce'],
                'type_question': question_dict.get('typeQuestion', question_dict.get('type_question', 'qcm')),
                'options': options_textes,
                'points': question_dict['points'],
                'aide': question_dict.get('explication')
                # Ne PAS inclure: 'reponseCorrecte', 'reponse_correcte', ou toute info sur les bonnes réponses
            }

            # Pour vrai/faux, créer des options
            if question_formatee['type_question'] == 'vrai_faux':
                question_formatee['options'] = ['Vrai', 'Faux']

            questions_formatees.append(question_formatee)

        # Calculer la durée restante (en secondes) basée sur le temps réel écoulé
        # IMPORTANT: Le temps restant est calculé depuis date_debut pour éviter la triche
        now = datetime.utcnow()
        duree_totale_secondes = session.duree_minutes * 60
        
        # Récupérer l'objet Resultat pour accéder à date_debut
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError("Résultat non trouvé après création")
        
        # Calculer le temps écoulé depuis le début de l'examen
        temps_ecoule_secondes = (now - resultat.date_debut).total_seconds()
        duree_restante_secondes = max(0, duree_totale_secondes - int(temps_ecoule_secondes))

        # Formater la session comme examen
        examen_formate = {
            'id': session.id,
            'titre': session.titre,
            'description': session.description,
            'matiere': qcm.matiere if qcm else 'Non spécifiée',
            'niveau': session.classe.niveau.nom if session.classe and session.classe.niveau else 'Non spécifié',
            'date_debut': session.date_debut.isoformat(),
            'date_fin': session.date_fin.isoformat(),
            'duree_minutes': session.duree_minutes,
            'nombre_questions': len(questions_formatees),
            'total_points': sum([q['points'] for q in questions_formatees]),
            'statut': 'en_cours',
            # NOTE: tentatives_restantes désactivé temporairement (pas de limite)
            'tentatives_restantes': 999  # Valeur arbitraire élevée pour indiquer "illimité"
        }

        return {
            'session_id': resultat_id,  # Le resultat_id sert de session_id pour le frontend
            'examen': examen_formate,
            'duree_restante_secondes': duree_restante_secondes,
            'date_debut_examen': resultat.date_debut.isoformat() if resultat.date_debut else None,
            'duree_totale_secondes': duree_totale_secondes,
            'questions': questions_formatees,
            'reponses_sauvegardees': {}
        }

    def soumettre_reponses(self, resultat_id: str, reponses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Soumet les réponses d'un étudiant et calcule le score automatiquement
        """
        from app.repositories.question_repository import QuestionRepository
        
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError("Résultat non trouvé")

        if resultat.status != 'en_cours':
            raise ValueError("Cet examen n'est plus en cours")

        # Calculer la durée réelle
        now = datetime.utcnow()
        duree_reelle = int((now - resultat.date_debut).total_seconds())

        # Récupérer les questions du QCM pour la correction
        question_repo = QuestionRepository()
        questions = question_repo.get_by_qcm(resultat.qcm_id)
        
        # Créer un dictionnaire des questions par ID pour accès rapide
        questions_dict = {q.id: q for q in questions}
        
        # Créer une liste ordonnée des questions pour le numéro
        questions_list = list(questions)
        questions_id_to_numero = {q.id: idx + 1 for idx, q in enumerate(questions_list)}
        
        # Préparer les détails des réponses avec correction
        reponses_detail = {}
        score_total = 0.0
        questions_correctes = 0
        questions_incorrectes = 0
        
        # Corriger chaque réponse
        for question_id, reponse_etudiant in reponses.items():
            question = questions_dict.get(question_id)
            if not question:
                # Log pour débogage
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Question {question_id} non trouvée dans le QCM {resultat.qcm_id}")
                continue
            
            # Obtenir la bonne réponse
            reponse_correcte = self._get_correct_answer(question)
            
            # Comparer les réponses
            est_correcte = self._compare_answers(reponse_etudiant, reponse_correcte, question.type_question)
            
            # Calculer le score pour cette question
            score_question = question.points if est_correcte else 0.0
            score_total += score_question
            
            if est_correcte:
                questions_correctes += 1
            else:
                questions_incorrectes += 1
            
            # Stocker les détails de la réponse
            reponses_detail[question_id] = {
                'question_id': question_id,
                'question_enonce': question.enonce,
                'question_numero': questions_id_to_numero.get(question_id, 0),
                'answer': reponse_etudiant,
                'correct_answer': reponse_correcte,
                'correct': est_correcte,
                'score': score_question,
                'max_score': question.points,
                'feedback': question.explication if question.explication else ''
            }
        
        # Mettre à jour le résultat
        resultat.set_reponses_detail(reponses_detail)
        resultat.date_fin = now
        resultat.duree_reelle_secondes = duree_reelle
        resultat.questions_repondues = len(reponses)
        resultat.score_total = score_total
        resultat.questions_correctes = questions_correctes
        resultat.questions_incorrectes = questions_incorrectes
        resultat.questions_partielles = 0  # Pour l'instant, pas de questions partielles
        
        # Calculer la note sur 20 et le pourcentage
        if resultat.score_maximum > 0:
            resultat.pourcentage = (score_total / resultat.score_maximum) * 100
            resultat.note_sur_20 = (score_total / resultat.score_maximum) * 20
        else:
            resultat.pourcentage = 0
            resultat.note_sur_20 = 0
        
        # Vérifier si réussi (note >= note_passage de la session)
        session = self.session_repo.get_by_id(resultat.session_id)
        if session and resultat.note_sur_20 is not None:
            resultat.est_reussi = resultat.note_sur_20 >= session.note_passage
        
        resultat.status = 'termine'
        
        # Générer un commentaire automatique avec l'IA
        try:
            from app.services.ai_service import ai_service
            commentaire_ia = ai_service.generate_commentaire_resultat(
                note_sur_20=resultat.note_sur_20 or 0,
                pourcentage=resultat.pourcentage or 0,
                questions_correctes=questions_correctes,
                questions_total=resultat.questions_total,
                est_reussi=resultat.est_reussi
            )
            resultat.commentaire_prof = commentaire_ia
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Erreur génération commentaire IA: {e}, utilisation du fallback")
            # Fallback si l'IA échoue
            if resultat.pourcentage >= 80:
                resultat.commentaire_prof = "Excellent travail ! Continuez ainsi."
            elif resultat.pourcentage >= 50:
                resultat.commentaire_prof = "Bon travail. Quelques révisions nécessaires."
            else:
                resultat.commentaire_prof = "À améliorer. Revoyez les concepts de base."
        
        # Générer un feedback automatique basique (pour compatibilité)
        if resultat.pourcentage >= 80:
            resultat.feedback_auto = "Excellent travail ! Vous avez maîtrisé la majorité des concepts."
        elif resultat.pourcentage >= 50:
            resultat.feedback_auto = "Bon travail ! Continuez à réviser pour améliorer vos résultats."
        else:
            resultat.feedback_auto = "N'hésitez pas à revoir les concepts et à refaire l'examen."

        resultat = self.resultat_repo.update(resultat)
        return resultat.to_dict(include_details=True)
    
    def _get_correct_answer(self, question) -> Any:
        """
        Récupère la bonne réponse d'une question selon son type
        """
        if question.type_question == 'qcm':
            # Pour QCM, la bonne réponse est dans les options avec estCorrecte=True
            options = question.get_options()
            for opt in options:
                if isinstance(opt, dict):
                    # Vérifier estCorrecte (peut être bool True, string "true", ou 1)
                    est_correcte = opt.get('estCorrecte')
                    if est_correcte is True or est_correcte == True or (isinstance(est_correcte, str) and est_correcte.lower() == 'true'):
                        texte = opt.get('texte') or opt.get('text')
                        if texte:
                            return texte
            # Si pas trouvé dans les options, utiliser reponse_correcte
            if question.reponse_correcte:
                return question.reponse_correcte
            return None
        elif question.type_question == 'vrai_faux':
            # Pour vrai/faux, reponse_correcte peut être "Vrai", "Faux", True, False, etc.
            reponse = question.reponse_correcte
            if isinstance(reponse, str):
                reponse_lower = reponse.lower()
                if reponse_lower in ['true', 'vrai', '1', 'yes', 'oui']:
                    return True
                elif reponse_lower in ['false', 'faux', '0', 'no', 'non']:
                    return False
            return bool(reponse) if reponse is not None else None
        else:
            # Pour texte libre, retourner la réponse correcte telle quelle
            return question.reponse_correcte
    
    def _compare_answers(self, reponse_etudiant: Any, reponse_correcte: Any, type_question: str) -> bool:
        """
        Compare la réponse de l'étudiant avec la bonne réponse
        """
        if reponse_correcte is None:
            return False
            
        if type_question == 'qcm':
            # Pour QCM, comparer les textes (normaliser)
            rep_etudiant = str(reponse_etudiant).strip().lower() if reponse_etudiant is not None else ''
            rep_correcte = str(reponse_correcte).strip().lower() if reponse_correcte is not None else ''
            # Comparaison insensible à la casse et aux espaces
            return rep_etudiant == rep_correcte
        elif type_question == 'vrai_faux':
            # Pour vrai/faux, normaliser les booléens
            def normalize_bool(value):
                if isinstance(value, bool):
                    return value
                if isinstance(value, str):
                    value_lower = value.lower()
                    if value_lower in ['true', 'vrai', '1', 'yes', 'oui']:
                        return True
                    elif value_lower in ['false', 'faux', '0', 'no', 'non']:
                        return False
                # Si c'est None ou autre chose, considérer comme False
                return False
            return normalize_bool(reponse_etudiant) == normalize_bool(reponse_correcte)
        else:
            # Pour texte libre, comparaison simple (sera améliorée avec IA)
            rep_etudiant = str(reponse_etudiant).strip().lower() if reponse_etudiant is not None else ''
            rep_correcte = str(reponse_correcte).strip().lower() if reponse_correcte is not None else ''
            return rep_etudiant == rep_correcte

    def corriger_resultat(self, resultat_id: str, correction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Corrige un résultat (sera implémenté avec l'IA plus tard)

        Pour l'instant, permet de mettre à jour manuellement les scores
        """
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError("Résultat non trouvé")

        # Mise à jour des scores
        if 'score_total' in correction_data:
            resultat.score_total = float(correction_data['score_total'])

        if 'questions_correctes' in correction_data:
            resultat.questions_correctes = int(
                correction_data['questions_correctes'])

        if 'questions_incorrectes' in correction_data:
            resultat.questions_incorrectes = int(
                correction_data['questions_incorrectes'])

        if 'questions_partielles' in correction_data:
            resultat.questions_partielles = int(
                correction_data['questions_partielles'])

        # Calcul automatique de la note sur 20 et du pourcentage
        if resultat.score_maximum > 0:
            resultat.pourcentage = (
                resultat.score_total / resultat.score_maximum) * 100
            resultat.note_sur_20 = (
                resultat.score_total / resultat.score_maximum) * 20
        else:
            resultat.pourcentage = 0
            resultat.note_sur_20 = 0

        # Vérifier si réussi
        session = self.session_repo.get_by_id(resultat.session_id)
        if session and resultat.note_sur_20 is not None:
            resultat.est_reussi = resultat.note_sur_20 >= session.note_passage

        # Feedback
        if 'feedback_auto' in correction_data:
            resultat.feedback_auto = correction_data['feedback_auto']

        resultat = self.resultat_repo.update(resultat)
        return resultat.to_dict(include_details=True)

    def ajouter_commentaire_prof(self, resultat_id: str, commentaire: str, note_prof: Optional[float] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Ajoute un commentaire de professeur à un résultat"""
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError("Résultat non trouvé")

        # Vérification des permissions
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user and user.role not in [UserRole.ENSEIGNANT, UserRole.ADMIN]:
                raise ValueError(
                    "Seuls les enseignants et administrateurs peuvent ajouter des commentaires")

        resultat.commentaire_prof = commentaire

        # Note du prof (optionnelle)
        if note_prof is not None:
            try:
                note_prof = float(note_prof)
                if note_prof < 0 or note_prof > 20:
                    raise ValueError("La note doit être entre 0 et 20")
                resultat.note_prof = note_prof
            except (ValueError, TypeError):
                raise ValueError("La note doit être un nombre")

        resultat = self.resultat_repo.update(resultat)
        return resultat.to_dict()

    def regenerer_commentaire_ia(self, resultat_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Régénère le commentaire IA pour un résultat"""
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError("Résultat non trouvé")

        # Vérification des permissions
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user and user.role not in [UserRole.ENSEIGNANT, UserRole.ADMIN]:
                raise ValueError(
                    "Seuls les enseignants et administrateurs peuvent régénérer les commentaires")

        # S'assurer que les notes sont calculées
        if resultat.note_sur_20 is None or resultat.pourcentage is None:
            if resultat.score_maximum > 0:
                resultat.pourcentage = (resultat.score_total / resultat.score_maximum) * 100
                resultat.note_sur_20 = (resultat.score_total / resultat.score_maximum) * 20
            else:
                resultat.pourcentage = 0
                resultat.note_sur_20 = 0

        # Vérifier si réussi
        session = self.session_repo.get_by_id(resultat.session_id)
        if session and resultat.note_sur_20 is not None:
            resultat.est_reussi = resultat.note_sur_20 >= session.note_passage

        # Générer un nouveau commentaire avec l'IA
        try:
            from app.services.ai_service import ai_service
            commentaire_ia = ai_service.generate_commentaire_resultat(
                note_sur_20=resultat.note_sur_20 or 0,
                pourcentage=resultat.pourcentage or 0,
                questions_correctes=resultat.questions_correctes,
                questions_total=resultat.questions_total,
                est_reussi=resultat.est_reussi
            )
            resultat.commentaire_prof = commentaire_ia
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Erreur régénération commentaire IA: {e}, utilisation du fallback")
            # Fallback si l'IA échoue
            if resultat.pourcentage >= 80:
                resultat.commentaire_prof = "Excellent travail ! Continuez ainsi."
            elif resultat.pourcentage >= 50:
                resultat.commentaire_prof = "Bon travail. Quelques révisions nécessaires."
            else:
                resultat.commentaire_prof = "À améliorer. Revoyez les concepts de base."

        resultat = self.resultat_repo.update(resultat)
        return resultat.to_dict(include_details=True)

    def delete_resultat(self, resultat_id: str, user_id: Optional[str] = None) -> bool:
        """Supprime un résultat (admin only)"""
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user and user.role != UserRole.ADMIN:
                raise ValueError(
                    "Seuls les administrateurs peuvent supprimer des résultats")

        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError("Résultat non trouvé")

        return self.resultat_repo.delete(resultat)

    def get_stats_etudiant_format(self, etudiant_id: str) -> Dict[str, Any]:
        """
        Récupère les statistiques formatées pour le frontend (format EtudiantStats)
        """
        resultats = self.resultat_repo.get_by_etudiant(etudiant_id)
        resultats_termines = [r for r in resultats if r.status == 'termine']

        # Compter les examens passés
        examens_passes = len(resultats_termines)

        # Compter les examens en attente (sessions disponibles mais pas encore commencées)
        sessions_disponibles = self.session_repo.get_disponibles_etudiant(
            etudiant_id)
        sessions_deja_commencees = set(
            [r.session_id for r in resultats if r.status == 'en_cours'])
        examens_en_attente = len(
            [s for s in sessions_disponibles if s.id not in sessions_deja_commencees])

        # Calculer moyenne générale
        notes = [
            r.note_sur_20 for r in resultats_termines if r.note_sur_20 is not None]
        moyenne_generale = sum(notes) / len(notes) if notes else 0.0

        # Calculer taux de réussite
        reussis = len([r for r in resultats_termines if r.est_reussi])
        taux_reussite = (reussis / examens_passes *
                         100) if examens_passes > 0 else 0.0

        # Meilleure et moins bonne note
        meilleure_note = max(notes) if notes else 0.0
        moins_bonne_note = min(notes) if notes else 0.0

        return {
            'examens_passes': examens_passes,
            'examens_en_attente': examens_en_attente,
            'moyenne_generale': round(moyenne_generale, 2),
            'taux_reussite': round(taux_reussite, 1),
            'meilleure_note': round(meilleure_note, 2),
            'moins_bonne_note': round(moins_bonne_note, 2)
        }

    def get_recent_resultats(self, etudiant_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Récupère les résultats récents formatés pour le frontend (format RecentResult[])
        """
        resultats = self.resultat_repo.get_by_etudiant(etudiant_id)
        resultats_termines = [r for r in resultats if r.status == 'termine']
        resultats_termines.sort(
            key=lambda x: x.date_fin if x.date_fin else x.created_at, reverse=True)
        resultats_recent = resultats_termines[:limit]

        recent_results = []
        for r in resultats_recent:
            # Récupérer la session pour avoir le titre
            session = self.session_repo.get_by_id(r.session_id)
            if not session:
                continue

            # Récupérer le QCM pour avoir la matière
            qcm = self.qcm_repo.get_by_id(session.qcm_id) if session.qcm_id else None

            recent_results.append({
                'id': r.id,
                'examen_id': r.session_id,  # ID de la session/examen pour la redirection
                'examen_titre': session.titre,
                'matiere': qcm.matiere if qcm else 'Non spécifiée',
                'note': r.note_sur_20 or 0.0,
                'note_max': 20.0,
                'pourcentage': r.pourcentage or 0.0,
                'statut': 'corrige' if r.note_sur_20 is not None else 'en_attente',
                'date_passage': r.date_fin.isoformat() if r.date_fin else r.created_at.isoformat(),
                'feedback': r.feedback_auto or r.commentaire_prof
            })

        return recent_results

    def get_historique_complet(self, etudiant_id: str) -> Dict[str, Any]:
        """
        Récupère l'historique complet avec statistiques formaté pour le frontend (format HistoriqueNotes)
        """
        resultats = self.resultat_repo.get_by_etudiant(etudiant_id)
        resultats_termines = [r for r in resultats if r.status == 'termine']
        resultats_termines.sort(
            key=lambda x: x.date_fin if x.date_fin else x.created_at, reverse=True)

        # Construire la liste des résultats simplifiés
        resultats_simples = []
        for r in resultats_termines:
            session = self.session_repo.get_by_id(r.session_id)
            if not session:
                continue

            # Récupérer le QCM pour avoir la matière
            qcm = self.qcm_repo.get_by_id(session.qcm_id) if session.qcm_id else None

            resultats_simples.append({
                'id': r.id,
                'examen_titre': session.titre,
                'matiere': qcm.matiere if qcm else 'Non spécifiée',
                'note': r.note_sur_20 or 0.0,
                'note_max': 20.0,
                'pourcentage': r.pourcentage or 0.0,
                'date_passage': r.date_fin.isoformat() if r.date_fin else r.created_at.isoformat(),
                'statut': 'corrige' if r.note_sur_20 is not None else 'en_attente',
                'estPublie': r.est_publie
            })

        # Calculer les statistiques
        notes = [
            r.note_sur_20 for r in resultats_termines if r.note_sur_20 is not None]
        reussis = len([r for r in resultats_termines if r.est_reussi])

        statistiques = {
            'moyenne_generale': round(sum(notes) / len(notes), 2) if notes else 0.0,
            'meilleure_note': round(max(notes), 2) if notes else 0.0,
            'moins_bonne_note': round(min(notes), 2) if notes else 0.0,
            'total_examens': len(resultats_termines),
            'taux_reussite': round((reussis / len(resultats_termines) * 100), 1) if resultats_termines else 0.0
        }

        return {
            'resultats': resultats_simples,
            'statistiques': statistiques
        }

    def publier_resultat(self, resultat_id: str) -> Dict[str, Any]:
        """
        Publie un résultat individuel (rend visible pour l'étudiant)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError(f"Résultat {resultat_id} non trouvé")
        
        # Vérifier que le résultat est terminé
        if resultat.status != 'termine':
            raise ValueError("Seuls les résultats terminés peuvent être publiés")
        
        # Publier le résultat
        resultat.est_publie = True
        self.resultat_repo.update(resultat)
        
        logger.info(f"Résultat {resultat_id} publié pour étudiant {resultat.etudiant_id}")
        return resultat.to_dict()
    
    def depublier_resultat(self, resultat_id: str) -> Dict[str, Any]:
        """
        Dépublie un résultat individuel (masque pour l'étudiant)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError(f"Résultat {resultat_id} non trouvé")
        
        # Dépublier le résultat
        resultat.est_publie = False
        self.resultat_repo.update(resultat)
        
        logger.info(f"Résultat {resultat_id} dépublié pour étudiant {resultat.etudiant_id}")
        return resultat.to_dict()
    
    def publier_resultats_session(self, session_id: str) -> Dict[str, Any]:
        """
        Publie tous les résultats terminés d'une session (validation globale)
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Vérifier que la session existe
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError(f"Session {session_id} non trouvée")
        
        # Récupérer tous les résultats terminés de la session
        resultats = self.resultat_repo.get_by_session(session_id)
        resultats_termines = [r for r in resultats if r.status == 'termine']
        
        # Publier tous les résultats terminés
        count_publies = 0
        for resultat in resultats_termines:
            if not resultat.est_publie:
                resultat.est_publie = True
                self.resultat_repo.update(resultat)
                count_publies += 1
        
        # Mettre à jour le flag de publication globale de la session
        session.resultats_publies = True
        self.session_repo.update(session)
        
        logger.info(f"Session {session_id}: {count_publies} résultats publiés")
        
        return {
            'session_id': session_id,
            'total_resultats': len(resultats),
            'resultats_termines': len(resultats_termines),
            'resultats_publies': count_publies,
            'message': f'{count_publies} résultat(s) publié(s) avec succès'
        }
    
    def get_resultat_etudiant_filtre(self, resultat_id: str, user_id: str, user_role: str) -> Optional[Dict[str, Any]]:
        """
        Récupère un résultat avec filtrage selon le rôle et la publication
        - Enseignant/Admin : Voit tout
        - Étudiant : Ne voit les détails que si:
            * Le résultat est publié (est_publie = True) OU
            * La session a resultats_publies = True
            * ET la session autorise afficher_correction = True
        """
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            return None
        
        # Vérifier que l'étudiant demande bien son propre résultat
        if user_role == 'etudiant' and resultat.etudiant_id != user_id:
            raise ValueError("Accès non autorisé à ce résultat")
        
        # Si l'utilisateur est enseignant ou admin, retourner tout
        if user_role in ['enseignant', 'admin']:
            return resultat.to_dict(include_details=True)
        
        # Pour les étudiants, vérifier la publication
        session = resultat.session if resultat.session_id else None
        
        # Déterminer si le résultat peut être affiché en détail
        peut_voir_details = False
        if resultat.est_publie:
            peut_voir_details = True
        elif session and session.resultats_publies:
            peut_voir_details = True
        
        # Si étudiant et résultat non publié, retourner seulement infos partielles
        if user_role == 'etudiant' and not peut_voir_details:
            return {
                'id': resultat.id,
                'sessionId': resultat.session_id,
                'status': resultat.status,
                'estPublie': resultat.est_publie,
                'dateDebut': resultat.date_debut.isoformat() if resultat.date_debut else None,
                'dateFin': resultat.date_fin.isoformat() if resultat.date_fin else None,
                'dureeReelleSecondes': resultat.duree_reelle_secondes,
                'message': 'En attente de validation par l\'enseignant'
            }
        
        # Si étudiant et résultat publié, vérifier si on peut afficher la correction
        resultat_dict = resultat.to_dict(include_details=True)
        
        # Si la session n'autorise pas l'affichage de la correction, masquer les détails des réponses
        if user_role == 'etudiant' and session and not session.afficher_correction:
            # Retourner le résultat mais sans les détails des réponses correctes
            resultat_dict['afficherCorrection'] = False
            if 'reponses' in resultat_dict:
                # Masquer les informations de correction dans chaque réponse
                for reponse in resultat_dict['reponses']:
                    reponse.pop('reponseCorrecte', None)
                    reponse.pop('explication', None)
                    reponse.pop('feedback', None)
        else:
            resultat_dict['afficherCorrection'] = True
        
        return resultat_dict
