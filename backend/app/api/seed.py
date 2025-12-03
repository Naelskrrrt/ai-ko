"""
API Endpoint pour créer les utilisateurs de test
À utiliser uniquement en développement/test
"""
from flask import Blueprint, jsonify, request
import os

bp = Blueprint('seed', __name__)


@bp.route('/seed/init-db', methods=['POST'])
def init_database():
    """
    Initialise la base de données (crée toutes les tables)
    
    Requiert le header X-Seed-Key pour l'autorisation
    """
    # Vérification de sécurité
    seed_key = request.headers.get('X-Seed-Key')
    expected_key = os.getenv('SEED_SECRET_KEY', 'ai-ko-seed-2024')
    
    if seed_key != expected_key:
        return jsonify({
            'error': 'Non autorisé',
            'message': 'Header X-Seed-Key invalide ou manquant'
        }), 401
    
    try:
        from app import db
        
        # Créer toutes les tables
        db.create_all()
        
        return jsonify({
            'success': True,
            'message': 'Base de données initialisée avec succès',
            'tables_created': True
        }), 200
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@bp.route('/seed/enrichir', methods=['POST'])
def enrichir_database():
    """
    Enrichit la base de données avec toutes les données de référence
    (Niveaux, Établissements, Mentions, Parcours, Matières)
    
    Requiert le header X-Seed-Key pour l'autorisation
    """
    # Vérification de sécurité
    seed_key = request.headers.get('X-Seed-Key')
    expected_key = os.getenv('SEED_SECRET_KEY', 'ai-ko-seed-2024')
    
    if seed_key != expected_key:
        return jsonify({
            'error': 'Non autorisé',
            'message': 'Header X-Seed-Key invalide ou manquant'
        }), 401
    
    try:
        from app import db
        from app.models.niveau import Niveau
        from app.models.matiere import Matiere
        from app.models.parcours import Parcours
        from app.models.mention import Mention
        from app.models.etablissement import Etablissement
        
        created = {
            'niveaux': [],
            'etablissements': [],
            'mentions': [],
            'parcours': [],
            'matieres': []
        }
        
        # =====================================================================
        # 1. NIVEAUX (données de référence)
        # =====================================================================
        niveaux_data = [
            {'code': 'L1', 'nom': 'Licence 1', 'description': 'Première année de Licence', 'cycle': 'licence', 'ordre': 1},
            {'code': 'L2', 'nom': 'Licence 2', 'description': 'Deuxième année de Licence', 'cycle': 'licence', 'ordre': 2},
            {'code': 'L3', 'nom': 'Licence 3', 'description': 'Troisième année de Licence', 'cycle': 'licence', 'ordre': 3},
            {'code': 'M1', 'nom': 'Master 1', 'description': 'Première année de Master', 'cycle': 'master', 'ordre': 4},
            {'code': 'M2', 'nom': 'Master 2', 'description': 'Deuxième année de Master', 'cycle': 'master', 'ordre': 5},
        ]
        
        for niv_data in niveaux_data:
            niveau = Niveau.query.filter_by(code=niv_data['code']).first()
            if not niveau:
                niveau = Niveau(**niv_data, actif=True)
                db.session.add(niveau)
                created['niveaux'].append({'code': niv_data['code'], 'status': 'created'})
            else:
                created['niveaux'].append({'code': niv_data['code'], 'status': 'exists'})
        
        db.session.flush()
        
        # =====================================================================
        # 2. ÉTABLISSEMENT
        # =====================================================================
        etab = Etablissement.query.filter_by(code='ENI').first()
        if not etab:
            etab = Etablissement(
                code='ENI',
                nom='École Nationale d\'Informatique',
                nom_court='ENI',
                description='École d\'excellence en informatique et technologies numériques de l\'Université de Fianarantsoa',
                type_etablissement='école',
                adresse='BP 1487, Route Nationale 7',
                ville='Fianarantsoa',
                pays='Madagascar',
                code_postal='301',
                telephone='+261 20 75 508 01',
                email='contact@eni.mg',
                site_web='https://www.eni.mg',
                couleur_primaire='#1E40AF',
                actif=True
            )
            db.session.add(etab)
            db.session.flush()
            created['etablissements'].append({'code': 'ENI', 'status': 'created'})
        else:
            created['etablissements'].append({'code': 'ENI', 'status': 'exists'})
        
        # =====================================================================
        # 3. MENTIONS
        # =====================================================================
        mentions_data = [
            {
                'code': 'INFO',
                'nom': 'Informatique',
                'description': 'Formation en sciences informatiques et technologies de l\'information',
                'couleur': '#3B82F6',
                'icone': 'computer'
            },
            {
                'code': 'IA',
                'nom': 'Intelligence Artificielle',
                'description': 'Formation spécialisée en Intelligence Artificielle et Science des Données',
                'couleur': '#8B5CF6',
                'icone': 'brain'
            }
        ]
        
        mentions_map = {}
        for ment_data in mentions_data:
            mention = Mention.query.filter_by(code=ment_data['code']).first()
            if not mention:
                mention = Mention(
                    **ment_data,
                    etablissement_id=etab.id,
                    actif=True
                )
                db.session.add(mention)
                db.session.flush()
                created['mentions'].append({'code': ment_data['code'], 'status': 'created'})
            else:
                created['mentions'].append({'code': ment_data['code'], 'status': 'exists'})
            mentions_map[ment_data['code']] = mention
        
        # =====================================================================
        # 4. PARCOURS
        # =====================================================================
        parcours_data = [
            # Parcours de la mention INFO
            {'code': 'GLBD', 'nom': 'Génie Logiciel et Base de Données', 'description': 'Spécialisation en développement logiciel et gestion de bases de données', 'mention_code': 'INFO', 'duree_annees': 2},
            {'code': 'ASR', 'nom': 'Administration des Systèmes et Réseaux', 'description': 'Spécialisation en administration système et réseaux informatiques', 'mention_code': 'INFO', 'duree_annees': 2},
            {'code': 'INFO_GEN', 'nom': 'Informatique Générale', 'description': 'Formation généraliste en informatique', 'mention_code': 'INFO', 'duree_annees': 3},
            # Parcours de la mention IA
            {'code': 'GID', 'nom': 'Gouvernance et Ingénierie de Données', 'description': 'Spécialisation en gestion et analyse de données massives', 'mention_code': 'IA', 'duree_annees': 2},
            {'code': 'OCC', 'nom': 'Objets Connectés et Cybersécurité', 'description': 'Spécialisation en IoT et sécurité informatique', 'mention_code': 'IA', 'duree_annees': 2},
        ]
        
        for parc_data in parcours_data:
            parcours = Parcours.query.filter_by(code=parc_data['code']).first()
            if not parcours:
                mention = mentions_map.get(parc_data['mention_code'])
                if mention:
                    parcours = Parcours(
                        code=parc_data['code'],
                        nom=parc_data['nom'],
                        description=parc_data['description'],
                        mention_id=mention.id,
                        duree_annees=parc_data['duree_annees'],
                        actif=True
                    )
                    db.session.add(parcours)
                    created['parcours'].append({'code': parc_data['code'], 'status': 'created'})
            else:
                created['parcours'].append({'code': parc_data['code'], 'status': 'exists'})
        
        db.session.flush()
        
        # =====================================================================
        # 5. MATIÈRES
        # =====================================================================
        matieres_data = [
            # Matières de base en Informatique
            {'code': 'INFO101', 'nom': 'Algorithmique et Structures de Données', 'description': 'Fondamentaux des algorithmes et structures de données', 'coefficient': 3.0, 'couleur': '#3B82F6', 'icone': 'code'},
            {'code': 'INFO102', 'nom': 'Programmation Orientée Objet', 'description': 'Concepts de la POO avec Java/Python', 'coefficient': 3.0, 'couleur': '#10B981', 'icone': 'box'},
            {'code': 'INFO103', 'nom': 'Développement Web', 'description': 'HTML, CSS, JavaScript et frameworks modernes', 'coefficient': 2.5, 'couleur': '#F59E0B', 'icone': 'globe'},
            {'code': 'INFO104', 'nom': 'Bases de Données', 'description': 'SQL, NoSQL et conception de bases de données', 'coefficient': 3.0, 'couleur': '#EF4444', 'icone': 'database'},
            {'code': 'INFO105', 'nom': 'Systèmes d\'exploitation', 'description': 'Linux, Windows et administration système', 'coefficient': 2.5, 'couleur': '#6366F1', 'icone': 'terminal'},
            {'code': 'INFO106', 'nom': 'Réseaux et Internet', 'description': 'Protocoles réseau, TCP/IP et sécurité', 'coefficient': 2.5, 'couleur': '#EC4899', 'icone': 'wifi'},
            
            # Matières avancées
            {'code': 'INFO201', 'nom': 'Génie Logiciel', 'description': 'Méthodologies de développement et gestion de projets', 'coefficient': 3.0, 'couleur': '#14B8A6', 'icone': 'settings'},
            {'code': 'INFO202', 'nom': 'Intelligence Artificielle', 'description': 'Machine Learning, Deep Learning et NLP', 'coefficient': 3.0, 'couleur': '#8B5CF6', 'icone': 'brain'},
            {'code': 'INFO203', 'nom': 'Sécurité Informatique', 'description': 'Cryptographie, cybersécurité et audit', 'coefficient': 2.5, 'couleur': '#EF4444', 'icone': 'shield'},
            {'code': 'INFO204', 'nom': 'Développement Mobile', 'description': 'Android, iOS et frameworks cross-platform', 'coefficient': 2.5, 'couleur': '#22C55E', 'icone': 'smartphone'},
            
            # Matières transversales
            {'code': 'MATH101', 'nom': 'Mathématiques Discrètes', 'description': 'Logique, ensembles, graphes et combinatoire', 'coefficient': 2.0, 'couleur': '#0EA5E9', 'icone': 'calculator'},
            {'code': 'MATH102', 'nom': 'Probabilités et Statistiques', 'description': 'Statistiques descriptives et inférentielles', 'coefficient': 2.0, 'couleur': '#0EA5E9', 'icone': 'bar-chart'},
            {'code': 'COM101', 'nom': 'Communication Professionnelle', 'description': 'Expression écrite et orale professionnelle', 'coefficient': 1.5, 'couleur': '#A855F7', 'icone': 'message-circle'},
            {'code': 'ANG101', 'nom': 'Anglais Technique', 'description': 'Anglais appliqué à l\'informatique', 'coefficient': 1.5, 'couleur': '#F97316', 'icone': 'book'},
            {'code': 'PROJ101', 'nom': 'Projet Tutoré', 'description': 'Projet pratique encadré', 'coefficient': 4.0, 'couleur': '#84CC16', 'icone': 'folder'},
            
            # Matières IA spécialisées
            {'code': 'ML101', 'nom': 'Machine Learning Fondamentaux', 'description': 'Algorithmes d\'apprentissage supervisé et non supervisé', 'coefficient': 3.0, 'couleur': '#8B5CF6', 'icone': 'cpu'},
            {'code': 'DL201', 'nom': 'Deep Learning', 'description': 'Réseaux de neurones profonds et architectures avancées', 'coefficient': 4.0, 'couleur': '#EC4899', 'icone': 'layers'},
            {'code': 'NLP301', 'nom': 'Traitement du Langage Naturel', 'description': 'NLP, transformers et modèles de langage', 'coefficient': 3.0, 'couleur': '#10B981', 'icone': 'message-square'},
            {'code': 'CV401', 'nom': 'Computer Vision', 'description': 'Vision par ordinateur et traitement d\'images', 'coefficient': 3.0, 'couleur': '#F59E0B', 'icone': 'eye'},
            {'code': 'DATA101', 'nom': 'Data Engineering', 'description': 'Pipelines de données et Big Data', 'coefficient': 3.0, 'couleur': '#0EA5E9', 'icone': 'database'},
        ]
        
        for mat_data in matieres_data:
            matiere = Matiere.query.filter_by(code=mat_data['code']).first()
            if not matiere:
                matiere = Matiere(**mat_data, actif=True)
                db.session.add(matiere)
                created['matieres'].append({'code': mat_data['code'], 'nom': mat_data['nom'], 'status': 'created'})
            else:
                created['matieres'].append({'code': mat_data['code'], 'nom': mat_data['nom'], 'status': 'exists'})
        
        # COMMIT FINAL
        db.session.commit()
        
        # Statistiques
        stats = {
            'niveaux_created': len([n for n in created['niveaux'] if n['status'] == 'created']),
            'etablissements_created': len([e for e in created['etablissements'] if e['status'] == 'created']),
            'mentions_created': len([m for m in created['mentions'] if m['status'] == 'created']),
            'parcours_created': len([p for p in created['parcours'] if p['status'] == 'created']),
            'matieres_created': len([m for m in created['matieres'] if m['status'] == 'created']),
        }
        
        return jsonify({
            'success': True,
            'message': 'Base de données enrichie avec succès',
            'stats': stats,
            'data': created
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@bp.route('/seed/users', methods=['POST'])
def seed_users():
    """
    Crée les utilisateurs de test (Admin, Enseignant, Étudiant)
    
    Requiert le header X-Seed-Key pour l'autorisation
    """
    # Vérification de sécurité
    seed_key = request.headers.get('X-Seed-Key')
    expected_key = os.getenv('SEED_SECRET_KEY', 'ai-ko-seed-2024')
    
    if seed_key != expected_key:
        return jsonify({
            'error': 'Non autorisé',
            'message': 'Header X-Seed-Key invalide ou manquant'
        }), 401
    
    try:
        from app import db
        from app.models.user import User, UserRole
        from app.models.enseignant import Enseignant
        from app.models.etudiant import Etudiant
        from app.models.etablissement import Etablissement
        from app.models.mention import Mention
        from app.models.parcours import Parcours
        from app.models.niveau import Niveau
        from app.models.matiere import Matiere
        from datetime import date
        
        created = {
            'etablissement': None,
            'mention': None,
            'parcours': None,
            'niveau': None,
            'matieres': [],
            'admin': None,
            'enseignant': None,
            'etudiant': None
        }
        
        # 1. ÉTABLISSEMENT
        etablissement = Etablissement.query.filter_by(code='ENI-UNIV').first()
        if not etablissement:
            etablissement = Etablissement(
                code='ENI-UNIV',
                nom='École Nationale d\'Informatique',
                nom_court='ENI',
                description='École d\'excellence en informatique',
                type_etablissement='école',
                adresse='Lot VN 39 Ankatso',
                ville='Antananarivo',
                pays='Madagascar',
                telephone='+261 20 22 412 19',
                email='contact@eni.mg',
                couleur_primaire='#1E40AF',
                actif=True
            )
            db.session.add(etablissement)
            db.session.flush()
            created['etablissement'] = 'created'
        else:
            created['etablissement'] = 'exists'
        
        # 2. MENTION
        mention = Mention.query.filter_by(code='INFO').first()
        if not mention:
            mention = Mention(
                code='INFO',
                nom='Informatique',
                description='Formation en sciences informatiques',
                etablissement_id=etablissement.id,
                couleur='#3B82F6',
                actif=True
            )
            db.session.add(mention)
            db.session.flush()
            created['mention'] = 'created'
        else:
            created['mention'] = 'exists'
        
        # 3. PARCOURS
        parcours = Parcours.query.filter_by(code='IA-ML').first()
        if not parcours:
            parcours = Parcours(
                code='IA-ML',
                nom='Intelligence Artificielle et Machine Learning',
                description='Spécialisation en IA',
                mention_id=mention.id,
                duree_annees=2,
                actif=True
            )
            db.session.add(parcours)
            db.session.flush()
            created['parcours'] = 'created'
        else:
            created['parcours'] = 'exists'
        
        # 4. NIVEAU
        niveau = Niveau.query.filter_by(code='M1').first()
        if not niveau:
            niveau = Niveau(
                code='M1',
                nom='Master 1',
                description='Première année de Master',
                ordre=4,
                cycle='master',
                actif=True
            )
            db.session.add(niveau)
            db.session.flush()
            created['niveau'] = 'created'
        else:
            created['niveau'] = 'exists'
        
        # 5. MATIÈRES
        matieres_data = [
            {'code': 'ML-101', 'nom': 'Machine Learning Fondamentaux', 'coefficient': 3.0, 'couleur': '#8B5CF6'},
            {'code': 'DL-201', 'nom': 'Deep Learning', 'coefficient': 4.0, 'couleur': '#EC4899'},
            {'code': 'NLP-301', 'nom': 'Traitement du Langage Naturel', 'coefficient': 3.0, 'couleur': '#10B981'}
        ]
        
        matieres = []
        for mat_data in matieres_data:
            matiere = Matiere.query.filter_by(code=mat_data['code']).first()
            if not matiere:
                matiere = Matiere(**mat_data, actif=True)
                db.session.add(matiere)
                db.session.flush()
                created['matieres'].append({'code': mat_data['code'], 'status': 'created'})
            else:
                created['matieres'].append({'code': mat_data['code'], 'status': 'exists'})
            matieres.append(matiere)
        
        # 6. ADMIN
        admin_user = User.query.filter_by(email='admin@ai-ko.mg').first()
        if not admin_user:
            admin_user = User(
                email='admin@ai-ko.mg',
                name='Administrateur AI-KO',
                role=UserRole.ADMIN,
                email_verified=True,
                is_active=True,
                telephone='+261 34 00 000 00',
                date_naissance=date(1985, 1, 15)
            )
            admin_user.set_password('Admin@123')
            db.session.add(admin_user)
            db.session.flush()
            created['admin'] = {'email': 'admin@ai-ko.mg', 'password': 'Admin@123', 'status': 'created'}
        else:
            created['admin'] = {'email': 'admin@ai-ko.mg', 'status': 'exists'}
        
        # 7. ENSEIGNANT
        enseignant_user = User.query.filter_by(email='prof.rakoto@eni.mg').first()
        if not enseignant_user:
            enseignant_user = User(
                email='prof.rakoto@eni.mg',
                name='Dr. Jean RAKOTO',
                role=UserRole.ENSEIGNANT,
                email_verified=True,
                is_active=True,
                telephone='+261 34 12 345 67',
                date_naissance=date(1975, 6, 20)
            )
            enseignant_user.set_password('Prof@123')
            db.session.add(enseignant_user)
            db.session.flush()
            
            enseignant = Enseignant(
                user_id=enseignant_user.id,
                numero_enseignant='ENS-2024-001',
                grade='Maître de Conférences',
                specialite='Intelligence Artificielle et Machine Learning',
                departement='Département Informatique',
                bureau='Bureau A-204',
                horaires_disponibilite='Lundi: 08h-12h, Mercredi: 14h-17h',
                etablissement_id=etablissement.id,
                date_embauche=date(2010, 9, 1),
                actif=True
            )
            db.session.add(enseignant)
            db.session.flush()
            
            for matiere in matieres:
                enseignant.matieres.append(matiere)
            enseignant.niveaux.append(niveau)
            enseignant.parcours.append(parcours)
            enseignant.mentions.append(mention)
            
            created['enseignant'] = {
                'email': 'prof.rakoto@eni.mg',
                'password': 'Prof@123',
                'numero': 'ENS-2024-001',
                'status': 'created'
            }
        else:
            created['enseignant'] = {'email': 'prof.rakoto@eni.mg', 'status': 'exists'}
        
        # 8. ÉTUDIANT
        etudiant_user = User.query.filter_by(email='etudiant.randria@eni.mg').first()
        if not etudiant_user:
            etudiant_user = User(
                email='etudiant.randria@eni.mg',
                name='Marie RANDRIANARISOA',
                role=UserRole.ETUDIANT,
                email_verified=True,
                is_active=True,
                telephone='+261 33 98 765 43',
                date_naissance=date(2000, 3, 25)
            )
            etudiant_user.set_password('Etud@123')
            db.session.add(etudiant_user)
            db.session.flush()
            
            etudiant = Etudiant(
                user_id=etudiant_user.id,
                numero_etudiant='ETU-2024-0042',
                annee_admission='2023-2024',
                etablissement_id=etablissement.id,
                mention_id=mention.id,
                parcours_id=parcours.id,
                niveau_id=niveau.id,
                actif=True
            )
            db.session.add(etudiant)
            db.session.flush()
            
            # Insérer les matières avec les colonnes requises (annee_scolaire)
            from app.models.associations import etudiant_matieres_v2
            for matiere in matieres:
                db.session.execute(
                    etudiant_matieres_v2.insert().values(
                        etudiant_id=etudiant.id,
                        matiere_id=matiere.id,
                        annee_scolaire='2024-2025',
                        semestre=1
                    )
                )
            
            created['etudiant'] = {
                'email': 'etudiant.randria@eni.mg',
                'password': 'Etud@123',
                'numero': 'ETU-2024-0042',
                'status': 'created'
            }
        else:
            created['etudiant'] = {'email': 'etudiant.randria@eni.mg', 'status': 'exists'}
        
        # COMMIT
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Utilisateurs de test créés avec succès',
            'data': created,
            'credentials': {
                'admin': {'email': 'admin@ai-ko.mg', 'password': 'Admin@123'},
                'enseignant': {'email': 'prof.rakoto@eni.mg', 'password': 'Prof@123'},
                'etudiant': {'email': 'etudiant.randria@eni.mg', 'password': 'Etud@123'}
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

