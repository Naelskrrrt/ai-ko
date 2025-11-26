"""
Repository pour la gestion des Résultats
"""
from typing import List, Optional, Dict, Any
from sqlalchemy import and_, func, desc
from app.repositories.base_repository import BaseRepository
from app.models.resultat import Resultat


class ResultatRepository(BaseRepository[Resultat]):
    """Repository pour les opérations sur les Résultats"""

    def __init__(self):
        super().__init__(Resultat)

    def get_by_etudiant(self, etudiant_id: str) -> List[Resultat]:
        """Récupère tous les résultats d'un étudiant"""
        return self.session.query(Resultat).filter(
            Resultat.etudiant_id == etudiant_id
        ).order_by(Resultat.created_at.desc()).all()

    def get_by_session(self, session_id: str) -> List[Resultat]:
        """Récupère tous les résultats d'une session"""
        return self.session.query(Resultat).filter(
            Resultat.session_id == session_id
        ).order_by(Resultat.created_at.desc()).all()

    def get_by_qcm(self, qcm_id: str) -> List[Resultat]:
        """Récupère tous les résultats d'un QCM"""
        return self.session.query(Resultat).filter(
            Resultat.qcm_id == qcm_id
        ).order_by(Resultat.created_at.desc()).all()

    def get_by_etudiant_and_session(self, etudiant_id: str, session_id: str) -> List[Resultat]:
        """Récupère tous les résultats d'un étudiant pour une session donnée"""
        return self.session.query(Resultat).filter(
            and_(
                Resultat.etudiant_id == etudiant_id,
                Resultat.session_id == session_id
            )
        ).order_by(Resultat.numero_tentative).all()

    def get_derniere_tentative(self, etudiant_id: str, session_id: str) -> Optional[Resultat]:
        """Récupère la dernière tentative d'un étudiant pour une session"""
        return self.session.query(Resultat).filter(
            and_(
                Resultat.etudiant_id == etudiant_id,
                Resultat.session_id == session_id
            )
        ).order_by(desc(Resultat.numero_tentative)).first()

    def count_tentatives(self, etudiant_id: str, session_id: str) -> int:
        """Compte le nombre de tentatives d'un étudiant pour une session"""
        return self.session.query(Resultat).filter(
            and_(
                Resultat.etudiant_id == etudiant_id,
                Resultat.session_id == session_id
            )
        ).count()

    def get_statistiques_session(self, session_id: str) -> Dict[str, Any]:
        """Récupère les statistiques d'une session"""
        resultats = self.get_by_session(session_id)

        if not resultats:
            return {
                'nombre_participants': 0,
                'moyenne': 0,
                'note_min': 0,
                'note_max': 0,
                'taux_reussite': 0
            }

        notes = [r.note_sur_20 for r in resultats if r.note_sur_20 is not None]
        reussis = len([r for r in resultats if r.est_reussi])

        return {
            'nombre_participants': len(resultats),
            'moyenne': sum(notes) / len(notes) if notes else 0,
            'note_min': min(notes) if notes else 0,
            'note_max': max(notes) if notes else 0,
            'taux_reussite': (reussis / len(resultats) * 100) if resultats else 0
        }

    def get_statistiques_etudiant(self, etudiant_id: str) -> Dict[str, Any]:
        """Récupère les statistiques d'un étudiant"""
        resultats = self.get_by_etudiant(etudiant_id)

        if not resultats:
            return {
                'nombre_examens': 0,
                'moyenne_generale': 0,
                'taux_reussite': 0,
                'examens_reussis': 0,
                'examens_echoues': 0
            }

        notes = [r.note_sur_20 for r in resultats if r.note_sur_20 is not None and r.status == 'termine']
        reussis = len([r for r in resultats if r.est_reussi and r.status == 'termine'])
        termines = len([r for r in resultats if r.status == 'termine'])

        return {
            'nombre_examens': termines,
            'moyenne_generale': sum(notes) / len(notes) if notes else 0,
            'taux_reussite': (reussis / termines * 100) if termines else 0,
            'examens_reussis': reussis,
            'examens_echoues': termines - reussis
        }

    def get_statistiques_qcm(self, qcm_id: str) -> Dict[str, Any]:
        """Récupère les statistiques complètes d'un QCM"""
        resultats = self.get_by_qcm(qcm_id)
        
        # Filtrer uniquement les résultats terminés
        resultats_termines = [r for r in resultats if r.status == 'termine']
        
        if not resultats_termines:
            return {
                'nombre_soumissions': 0,
                'nombre_etudiants_uniques': 0,
                'moyenne_note_sur_20': 0,
                'moyenne_pourcentage': 0,
                'taux_reussite': 0,
                'note_min': 0,
                'note_max': 0,
                'note_mediane': 0,
                'duree_moyenne_secondes': 0,
                'distribution_notes': [],
                'statistiques_par_question': [],
                'resultats': []
            }
        
        # Statistiques de base
        notes_sur_20 = [r.note_sur_20 for r in resultats_termines if r.note_sur_20 is not None]
        pourcentages = [r.pourcentage for r in resultats_termines if r.pourcentage is not None]
        etudiants_uniques = len(set([r.etudiant_id for r in resultats_termines]))
        
        # Calculer médiane
        notes_triees = sorted(notes_sur_20) if notes_sur_20 else []
        mediane = 0
        if notes_triees:
            n = len(notes_triees)
            if n % 2 == 0:
                mediane = (notes_triees[n//2 - 1] + notes_triees[n//2]) / 2
            else:
                mediane = notes_triees[n//2]
        
        # Taux de réussite (note >= 10/20 par défaut, ou selon note_passage de session si disponible)
        # Pour l'instant, on utilise 10/20 comme seuil
        seuil_reussite = 10.0
        reussis = len([r for r in resultats_termines if r.note_sur_20 is not None and r.note_sur_20 >= seuil_reussite])
        taux_reussite = (reussis / len(resultats_termines) * 100) if resultats_termines else 0
        
        # Durée moyenne
        durees = [r.duree_reelle_secondes for r in resultats_termines if r.duree_reelle_secondes is not None]
        duree_moyenne = sum(durees) / len(durees) if durees else 0
        
        # Distribution des notes (histogramme par tranches de 2 points)
        distribution = {}
        for note in notes_sur_20:
            tranche = int(note // 2) * 2  # 0-2, 2-4, 4-6, etc.
            distribution[tranche] = distribution.get(tranche, 0) + 1
        
        distribution_liste = [{'tranche': f'{k}-{k+2}', 'nombre': v} for k, v in sorted(distribution.items())]
        
        # Statistiques par question
        from app.repositories.question_repository import QuestionRepository
        question_repo = QuestionRepository()
        questions = question_repo.get_by_qcm(qcm_id)
        
        stats_par_question = []
        for question in questions:
            question_id = question.id
            correctes = 0
            total = 0
            reponses_frequentes = {}
            
            for resultat in resultats_termines:
                reponses_detail = resultat.get_reponses_detail()
                if question_id in reponses_detail:
                    total += 1
                    reponse_data = reponses_detail[question_id]
                    if reponse_data.get('correct', False):
                        correctes += 1
                    
                    # Compter les réponses fréquentes
                    answer = reponse_data.get('answer', '')
                    if answer:
                        reponses_frequentes[answer] = reponses_frequentes.get(answer, 0) + 1
            
            taux_reussite_q = (correctes / total * 100) if total > 0 else 0
            reponses_frequentes_liste = sorted(
                [{'reponse': k, 'nombre': v} for k, v in reponses_frequentes.items()],
                key=lambda x: x['nombre'],
                reverse=True
            )[:5]  # Top 5 réponses
            
            stats_par_question.append({
                'question_id': question_id,
                'question_enonce': question.enonce[:100] + '...' if len(question.enonce) > 100 else question.enonce,
                'question_numero': questions.index(question) + 1,
                'taux_reussite': round(taux_reussite_q, 2),
                'nombre_reponses': total,
                'nombre_correctes': correctes,
                'reponses_frequentes': reponses_frequentes_liste
            })
        
        # Liste des résultats (limité à 50 pour éviter une réponse trop lourde)
        resultats_liste = []
        for r in resultats_termines[:50]:
            resultats_liste.append({
                'id': r.id,
                'etudiant_id': r.etudiant_id,
                'etudiant_nom': r.etudiant.name if r.etudiant else 'Inconnu',
                'etudiant_email': r.etudiant.email if r.etudiant else '',
                'note_sur_20': r.note_sur_20,
                'pourcentage': r.pourcentage,
                'questions_correctes': r.questions_correctes,
                'questions_total': r.questions_total,
                'duree_secondes': r.duree_reelle_secondes,
                'date_fin': r.date_fin.isoformat() if r.date_fin else None,
                'est_reussi': r.est_reussi
            })
        
        return {
            'nombre_soumissions': len(resultats_termines),
            'nombre_etudiants_uniques': etudiants_uniques,
            'moyenne_note_sur_20': round(sum(notes_sur_20) / len(notes_sur_20), 2) if notes_sur_20 else 0,
            'moyenne_pourcentage': round(sum(pourcentages) / len(pourcentages), 2) if pourcentages else 0,
            'taux_reussite': round(taux_reussite, 2),
            'note_min': round(min(notes_sur_20), 2) if notes_sur_20 else 0,
            'note_max': round(max(notes_sur_20), 2) if notes_sur_20 else 0,
            'note_mediane': round(mediane, 2),
            'duree_moyenne_secondes': round(duree_moyenne, 0),
            'distribution_notes': distribution_liste,
            'statistiques_par_question': stats_par_question,
            'resultats': resultats_liste
        }

    def get_all_paginated(self, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None) -> tuple[List[Resultat], int]:
        """Récupère les résultats avec pagination et filtres"""
        query = self.session.query(Resultat)

        if filters:
            if 'etudiant_id' in filters and filters['etudiant_id']:
                query = query.filter(Resultat.etudiant_id == filters['etudiant_id'])

            if 'session_id' in filters and filters['session_id']:
                query = query.filter(Resultat.session_id == filters['session_id'])

            if 'qcm_id' in filters and filters['qcm_id']:
                query = query.filter(Resultat.qcm_id == filters['qcm_id'])

            if 'status' in filters and filters['status']:
                query = query.filter(Resultat.status == filters['status'])

            if 'est_reussi' in filters and filters['est_reussi'] is not None:
                query = query.filter(Resultat.est_reussi == filters['est_reussi'])

        total = query.count()
        resultats = query.order_by(Resultat.created_at.desc()).offset(skip).limit(limit).all()

        return resultats, total
