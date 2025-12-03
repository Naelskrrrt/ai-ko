"""
Service pour la génération de rapports PDF
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.platypus import Image as RLImage
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.repositories.resultat_repository import ResultatRepository
from app.repositories.session_examen_repository import SessionExamenRepository
from app.repositories.user_repository import UserRepository
from app.repositories.qcm_repository import QCMRepository
from app.repositories.etudiant_repository import EtudiantRepository


class PDFService:
    """Service pour générer des PDF de résultats"""

    def __init__(self):
        self.resultat_repo = ResultatRepository()
        self.session_repo = SessionExamenRepository()
        self.user_repo = UserRepository()
        self.qcm_repo = QCMRepository()
        self.etudiant_repo = EtudiantRepository()

    def generer_pdf_resultat_individuel(self, resultat_id: str) -> BytesIO:
        """
        Génère un PDF détaillé pour un résultat d'étudiant individuel
        """
        # Récupérer le résultat
        resultat = self.resultat_repo.get_by_id(resultat_id)
        if not resultat:
            raise ValueError(f"Résultat {resultat_id} non trouvé")

        # Récupérer l'étudiant et son profil
        etudiant_user = self.user_repo.get_by_id(resultat.etudiant_id)
        if not etudiant_user:
            raise ValueError("Étudiant non trouvé")

        # Récupérer le profil étudiant complet
        etudiant_profil = None
        if hasattr(etudiant_user, 'etudiant_profil') and etudiant_user.etudiant_profil:
            etudiant_profil = etudiant_user.etudiant_profil

        # Récupérer la session et le QCM
        session = self.session_repo.get_by_id(resultat.session_id) if resultat.session_id else None
        qcm = self.qcm_repo.get_by_id(resultat.qcm_id)

        # Créer le buffer PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a56db'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12
        )
        normal_style = styles['Normal']

        # Contenu du document
        story = []

        # Titre
        story.append(Paragraph("Rapport de Résultat d'Examen", title_style))
        story.append(Spacer(1, 0.3 * inch))

        # Informations de l'étudiant
        story.append(Paragraph("Informations de l'Étudiant", heading_style))
        
        etudiant_data = [
            ['Nom complet', etudiant_user.name or 'Non renseigné'],
            ['Email', etudiant_user.email or 'Non renseigné'],
            ['Téléphone', etudiant_user.telephone or 'Non renseigné'],
            ['Date de naissance', etudiant_user.date_naissance.strftime('%d/%m/%Y') if etudiant_user.date_naissance else 'Non renseigné'],
        ]

        # Ajouter infos du profil étudiant si disponible
        if etudiant_profil:
            etudiant_data.append(['Numéro étudiant', etudiant_profil.numero_etudiant or 'Non renseigné'])
            
            # Récupérer niveau actuel
            if hasattr(etudiant_profil, 'niveaux_association') and etudiant_profil.niveaux_association:
                niveaux_actuels = [na for na in etudiant_profil.niveaux_association if na.est_actuel]
                if niveaux_actuels and niveaux_actuels[0].niveau:
                    etudiant_data.append(['Niveau', niveaux_actuels[0].niveau.nom])
            
            # Récupérer classe actuelle
            if hasattr(etudiant_profil, 'classes_association') and etudiant_profil.classes_association:
                classes_actuelles = [ca for ca in etudiant_profil.classes_association if ca.est_actuelle]
                if classes_actuelles and classes_actuelles[0].classe:
                    classe = classes_actuelles[0].classe
                    etudiant_data.append(['Classe', f"{classe.nom} ({classe.code})"])

        etudiant_table = Table(etudiant_data, colWidths=[2 * inch, 4 * inch])
        etudiant_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(etudiant_table)
        story.append(Spacer(1, 0.3 * inch))

        # Informations de l'examen
        story.append(Paragraph("Informations de l'Examen", heading_style))
        
        examen_data = [
            ['Examen', session.titre if session else 'N/A'],
            ['Matière', qcm.matiere if qcm and qcm.matiere else 'Non spécifiée'],
            ['Date de passage', resultat.date_debut.strftime('%d/%m/%Y à %H:%M') if resultat.date_debut else 'N/A'],
            ['Durée', f"{resultat.duree_reelle_secondes // 60} min {resultat.duree_reelle_secondes % 60} sec" if resultat.duree_reelle_secondes else 'N/A'],
            ['Tentative', f"#{resultat.numero_tentative}"]
        ]

        examen_table = Table(examen_data, colWidths=[2 * inch, 4 * inch])
        examen_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(examen_table)
        story.append(Spacer(1, 0.3 * inch))

        # Résultats
        story.append(Paragraph("Résultats", heading_style))
        
        # Déterminer la couleur selon la réussite
        note_color = colors.HexColor('#10b981') if resultat.est_reussi else colors.HexColor('#ef4444')
        
        resultats_data = [
            ['Note sur 20', f"{resultat.note_sur_20:.2f}/20" if resultat.note_sur_20 else 'N/A'],
            ['Pourcentage', f"{resultat.pourcentage:.1f}%" if resultat.pourcentage else 'N/A'],
            ['Score', f"{resultat.score_total:.1f}/{resultat.score_maximum:.1f}"],
            ['Questions correctes', f"{resultat.questions_correctes}/{resultat.questions_total}"],
            ['Questions incorrectes', f"{resultat.questions_incorrectes}"],
            ['Statut', 'REUSSI' if resultat.est_reussi else 'ECHOUE']
        ]

        resultats_table = Table(resultats_data, colWidths=[2 * inch, 4 * inch])
        resultats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('TEXTCOLOR', (1, -1), (1, -1), note_color),  # Couleur pour le statut
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'),  # Bold pour le statut
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('FONTSIZE', (1, -1), (1, -1), 12),  # Plus grand pour le statut
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(resultats_table)
        story.append(Spacer(1, 0.3 * inch))

        # Commentaires et feedback
        if resultat.commentaire_prof or resultat.feedback_auto:
            story.append(Paragraph("Commentaires", heading_style))
            
            if resultat.commentaire_prof:
                story.append(Paragraph(f"<b>Commentaire de l'enseignant:</b>", normal_style))
                story.append(Paragraph(resultat.commentaire_prof, normal_style))
                story.append(Spacer(1, 0.1 * inch))
            
            if resultat.feedback_auto:
                story.append(Paragraph(f"<b>Feedback automatique:</b>", normal_style))
                story.append(Paragraph(resultat.feedback_auto, normal_style))
            
            story.append(Spacer(1, 0.3 * inch))

        # Détails des réponses
        reponses_detail = resultat.get_reponses_detail()
        if reponses_detail:
            story.append(PageBreak())
            story.append(Paragraph("Détail des Réponses", heading_style))
            story.append(Spacer(1, 0.2 * inch))

            for question_id, detail in reponses_detail.items():
                # Afficher chaque question
                question_numero = detail.get('question_numero', '?')
                question_enonce = detail.get('question_enonce', 'Question')
                est_correcte = detail.get('correct', False)
                reponse_etudiant = detail.get('answer', 'Non répondu')
                reponse_correcte = detail.get('correct_answer', 'N/A')
                score = detail.get('score', 0)
                max_score = detail.get('max_score', 0)
                feedback = detail.get('feedback', '')

                # Couleur selon si correct ou non
                color = colors.HexColor('#10b981') if est_correcte else colors.HexColor('#ef4444')

                story.append(Paragraph(f"<b>Question {question_numero}:</b> {question_enonce}", normal_style))
                story.append(Spacer(1, 0.05 * inch))

                question_detail_data = [
                    ['Votre reponse', str(reponse_etudiant)],
                    ['Reponse correcte', str(reponse_correcte)],
                    ['Score', f"{score}/{max_score}"],
                    ['Resultat', 'Correct' if est_correcte else 'Incorrect']
                ]

                if feedback:
                    question_detail_data.append(['Explication', feedback])

                question_table = Table(question_detail_data, colWidths=[1.5 * inch, 4.5 * inch])
                question_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9fafb')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('TEXTCOLOR', (1, 3), (1, 3), color),  # Couleur pour le résultat
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb'))
                ]))
                story.append(question_table)
                story.append(Spacer(1, 0.2 * inch))

        # Footer
        story.append(Spacer(1, 0.5 * inch))
        footer_text = f"<i>Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}</i>"
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=normal_style, fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))

        # Construire le PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def generer_pdf_recapitulatif_session(self, session_id: str) -> BytesIO:
        """
        Génère un PDF récapitulatif pour une session d'examen (tous les étudiants)
        """
        # Récupérer la session
        session = self.session_repo.get_by_id(session_id)
        if not session:
            raise ValueError(f"Session {session_id} non trouvée")

        # Récupérer tous les résultats de la session
        resultats = self.resultat_repo.get_by_session(session_id)
        resultats_termines = [r for r in resultats if r.status == 'termine']

        # Récupérer le QCM
        qcm = self.qcm_repo.get_by_id(session.qcm_id) if session.qcm_id else None

        # Calculer les statistiques
        notes = [r.pourcentage for r in resultats_termines if r.pourcentage is not None]
        moyenne = sum(notes) / len(notes) if notes else 0
        taux_reussite = len([r for r in resultats_termines if r.est_reussi]) / len(resultats_termines) * 100 if resultats_termines else 0
        meilleure_note = max(notes) if notes else 0
        moins_bonne_note = min(notes) if notes else 0

        # Créer le buffer PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a56db'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12
        )
        normal_style = styles['Normal']

        # Contenu du document
        story = []

        # Titre
        story.append(Paragraph("Rapport Récapitulatif de Session", title_style))
        story.append(Spacer(1, 0.3 * inch))

        # Informations de la session
        story.append(Paragraph("Informations de la Session", heading_style))
        
        session_data = [
            ['Titre', session.titre],
            ['Description', session.description or 'Aucune description'],
            ['Matière', qcm.matiere if qcm and qcm.matiere else 'Non spécifiée'],
            ['Date de début', session.date_debut.strftime('%d/%m/%Y à %H:%M')],
            ['Date de fin', session.date_fin.strftime('%d/%m/%Y à %H:%M')],
            ['Durée', f"{session.duree_minutes} minutes"],
            ['Note de passage', f"{session.note_passage}/20"]
        ]

        session_table = Table(session_data, colWidths=[2 * inch, 4 * inch])
        session_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(session_table)
        story.append(Spacer(1, 0.3 * inch))

        # Statistiques globales
        story.append(Paragraph("Statistiques Globales", heading_style))
        
        stats_data = [
            ['Total d\'étudiants', str(len(resultats))],
            ['Examens terminés', str(len(resultats_termines))],
            ['Examens en cours', str(len([r for r in resultats if r.status == 'en_cours']))],
            ['Moyenne générale', f"{moyenne:.1f}%"],
            ['Taux de réussite', f"{taux_reussite:.1f}%"],
            ['Meilleure note', f"{meilleure_note:.1f}%"],
            ['Moins bonne note', f"{moins_bonne_note:.1f}%"]
        ]

        stats_table = Table(stats_data, colWidths=[2 * inch, 4 * inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#dbeafe')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),  # Bold pour total
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#93c5fd'))
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 0.4 * inch))

        # Liste des étudiants
        if resultats_termines:
            story.append(Paragraph("Liste des Résultats", heading_style))
            story.append(Spacer(1, 0.1 * inch))

            # En-têtes du tableau
            etudiants_data = [['Nom', 'Email', 'Note /20', 'Pourcentage', 'Statut']]

            # Ajouter chaque étudiant
            for resultat in sorted(resultats_termines, key=lambda x: x.pourcentage or 0, reverse=True):
                etudiant = self.user_repo.get_by_id(resultat.etudiant_id)
                if etudiant:
                    nom = etudiant.name or 'N/A'
                    email = etudiant.email or 'N/A'
                    note = f"{resultat.note_sur_20:.2f}" if resultat.note_sur_20 is not None else 'N/A'
                    pourcentage = f"{resultat.pourcentage:.1f}%" if resultat.pourcentage is not None else 'N/A'
                    statut = 'Reussi' if resultat.est_reussi else 'Echoue'
                    
                    etudiants_data.append([nom, email, note, pourcentage, statut])

            etudiants_table = Table(etudiants_data, colWidths=[1.5 * inch, 2 * inch, 0.8 * inch, 1 * inch, 1 * inch])
            etudiants_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 1), (1, -1), 'LEFT'),
                ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db'))
            ]))
            story.append(etudiants_table)

        # Footer
        story.append(Spacer(1, 0.5 * inch))
        footer_text = f"<i>Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}</i>"
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=normal_style, fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))

        # Construire le PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def generer_pdf_eleves_enseignant(
        self,
        enseignant_id: str,
        etudiants_data: List[Dict[str, Any]],
        filters: Optional[Dict[str, Any]] = None
    ) -> BytesIO:
        """
        Génère un PDF listant les élèves liés à un enseignant
        """
        from app.repositories.enseignant_repository import EnseignantRepository
        from app.repositories.matiere_repository import MatiereRepository
        from app.repositories.niveau_repository import NiveauRepository
        from app.repositories.parcours_repository import ParcoursRepository

        enseignant_repo = EnseignantRepository()
        matiere_repo = MatiereRepository()
        niveau_repo = NiveauRepository()
        parcours_repo = ParcoursRepository()

        # Récupérer l'enseignant
        enseignant = enseignant_repo.get_by_id(enseignant_id)
        if not enseignant:
            raise ValueError(f"Enseignant {enseignant_id} non trouvé")

        # Récupérer le nom de l'enseignant
        enseignant_name = enseignant.user.name if enseignant.user else "Enseignant"

        # Créer le buffer PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)

        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a56db'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=12,
            spaceBefore=12
        )
        normal_style = styles['Normal']

        # Contenu du document
        story = []

        # Titre
        story.append(Paragraph("Liste des Élèves", title_style))
        story.append(Spacer(1, 0.2 * inch))

        # Informations de l'enseignant
        story.append(Paragraph("Informations de l'Enseignant", heading_style))
        
        enseignant_data = [
            ['Nom', enseignant_name],
            ['Numéro enseignant', enseignant.numero_enseignant or 'Non renseigné'],
        ]

        enseignant_table = Table(enseignant_data, colWidths=[2 * inch, 4 * inch])
        enseignant_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        story.append(enseignant_table)
        story.append(Spacer(1, 0.3 * inch))

        # Afficher les filtres appliqués si présents
        if filters:
            story.append(Paragraph("Filtres Appliqués", heading_style))
            filtres_data = []
            
            if filters.get('matiere_id'):
                matiere = matiere_repo.get_by_id(filters['matiere_id'])
                if matiere:
                    filtres_data.append(['Matière', matiere.nom])
            
            if filters.get('niveau_id'):
                niveau = niveau_repo.get_by_id(filters['niveau_id'])
                if niveau:
                    filtres_data.append(['Niveau', niveau.nom])
            
            if filters.get('parcours_id'):
                parcours = parcours_repo.get_by_id(filters['parcours_id'])
                if parcours:
                    filtres_data.append(['Parcours', parcours.nom])
            
            if filters.get('mention_id'):
                from app.repositories.mention_repository import MentionRepository
                mention_repo = MentionRepository()
                mention = mention_repo.get_by_id(filters['mention_id'])
                if mention:
                    filtres_data.append(['Mention', mention.nom])
            
            if filtres_data:
                filtres_table = Table(filtres_data, colWidths=[2 * inch, 4 * inch])
                filtres_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#dbeafe')),
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#93c5fd'))
                ]))
                story.append(filtres_table)
                story.append(Spacer(1, 0.3 * inch))

        # Liste des élèves
        if etudiants_data:
            story.append(Paragraph(f"Liste des Élèves ({len(etudiants_data)} élève(s))", heading_style))
            story.append(Spacer(1, 0.1 * inch))

            # En-têtes du tableau
            eleves_data = [['Nom', 'Email', 'Numéro', 'Niveau', 'Parcours', 'Téléphone']]

            # Ajouter chaque élève
            for etudiant in etudiants_data:
                nom = etudiant.get('nom') or etudiant.get('name') or 'N/A'
                email = etudiant.get('email') or 'N/A'
                numero = etudiant.get('numero_etudiant') or etudiant.get('numeroEtudiant') or '-'
                
                # Récupérer niveau
                niveau_nom = '-'
                if etudiant.get('niveau'):
                    niveau_nom = etudiant['niveau'].get('nom', '-') if isinstance(etudiant['niveau'], dict) else (etudiant['niveau'].nom if hasattr(etudiant['niveau'], 'nom') else '-')
                
                # Récupérer parcours
                parcours_nom = '-'
                if etudiant.get('parcours'):
                    parcours_nom = etudiant['parcours'].get('nom', '-') if isinstance(etudiant['parcours'], dict) else (etudiant['parcours'].nom if hasattr(etudiant['parcours'], 'nom') else '-')
                
                telephone = etudiant.get('telephone') or etudiant.get('user', {}).get('telephone') if isinstance(etudiant.get('user'), dict) else '-'
                if not telephone or telephone == 'None':
                    telephone = '-'
                
                eleves_data.append([nom, email, numero, niveau_nom, parcours_nom, telephone])

            eleves_table = Table(eleves_data, colWidths=[1.2 * inch, 1.5 * inch, 0.8 * inch, 0.8 * inch, 0.8 * inch, 1 * inch])
            eleves_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 1), (1, -1), 'LEFT'),
                ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db'))
            ]))
            story.append(eleves_table)
        else:
            story.append(Paragraph("Aucun élève trouvé", normal_style))

        # Footer
        story.append(Spacer(1, 0.5 * inch))
        footer_text = f"<i>Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}</i>"
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=normal_style, fontSize=8, textColor=colors.grey, alignment=TA_CENTER)))

        # Construire le PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

