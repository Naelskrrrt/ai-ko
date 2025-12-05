"""
Routes API pour la gestion des Étudiants
"""
from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.repositories.etudiant_repository import EtudiantRepository
from app.repositories.user_repository import UserRepository
from app.models.user import UserRole
import logging

logger = logging.getLogger(__name__)

api = Namespace('etudiants', description='Opérations sur les étudiants')

# Modèles Swagger
etudiant_model = api.model('Etudiant', {
    'id': fields.String(description='ID de l\'étudiant'),
    'userId': fields.String(required=True, description='ID de l\'utilisateur'),
    'numeroEtudiant': fields.String(required=True, description='Numéro d\'étudiant'),
    'anneeAdmission': fields.String(description='Année d\'admission'),
    'etablissementId': fields.String(required=True, description='ID de l\'établissement'),
    'mentionId': fields.String(description='ID de la mention'),
    'parcoursId': fields.String(description='ID du parcours'),
    'niveauId': fields.String(description='ID du niveau'),
    'actif': fields.Boolean(description='Étudiant actif'),
    'name': fields.String(description='Nom de l\'étudiant'),
    'email': fields.String(description='Email de l\'étudiant'),
})

etudiant_update_model = api.model('EtudiantUpdate', {
    'numeroEtudiant': fields.String(),
    'anneeAdmission': fields.String(),
    'etablissementId': fields.String(),
    'mentionId': fields.String(),
    'parcoursId': fields.String(),
    'niveauId': fields.String(),
    'actif': fields.Boolean(),
})

etudiant_repo = EtudiantRepository()
user_repo = UserRepository()


def require_admin():
    """Vérifie que l'utilisateur est admin"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if not user or user.role != UserRole.ADMIN:
        api.abort(403, "Accès réservé aux administrateurs")


def require_admin_or_self(etudiant_id):
    """Vérifie que l'utilisateur est admin ou l'étudiant lui-même"""
    user_id = get_jwt_identity()
    user = user_repo.get_by_id(user_id)
    if user.role == UserRole.ADMIN:
        return
    # Vérifier si c'est l'étudiant lui-même
    etudiant = etudiant_repo.get_by_user_id(user_id)
    if not etudiant or etudiant.id != etudiant_id:
        api.abort(403, "Accès non autorisé")


@api.route('')
class EtudiantList(Resource):
    @api.doc('list_etudiants')
    @api.param('page', 'Page', type='int', default=1)
    @api.param('per_page', 'Résultats par page', type='int', default=50)
    @jwt_required()
    def get(self):
        """Liste tous les étudiants (pagination)"""
        try:
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 50))
            
            # Récupérer tous les étudiants avec pagination
            from app import db
            from app.models.etudiant import Etudiant
            
            query = db.session.query(Etudiant).filter(Etudiant.actif == True)
            total = query.count()
            
            etudiants = query.offset((page - 1) * per_page).limit(per_page).all()
            
            return {
                'items': [e.to_dict() for e in etudiants],
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            }, 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiants: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('create_etudiant', security='Bearer')
    @api.expect(etudiant_model)
    @jwt_required()
    def post(self):
        """Crée un étudiant (admin only)"""
        try:
            require_admin()
            data = request.get_json()
            
            from app.models.etudiant import Etudiant
            from app import db
            
            # Convertir camelCase en snake_case
            etudiant = Etudiant(
                user_id=data.get('userId'),
                numero_etudiant=data.get('numeroEtudiant'),
                annee_admission=data.get('anneeAdmission'),
                etablissement_id=data.get('etablissementId'),
                mention_id=data.get('mentionId'),
                parcours_id=data.get('parcoursId'),
                niveau_id=data.get('niveauId'),
                actif=data.get('actif', True)
            )
            
            db.session.add(etudiant)
            db.session.commit()
            
            return etudiant.to_dict(), 201
        except Exception as e:
            logger.error(f"Erreur création étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/me')
class EtudiantMe(Resource):
    @api.doc('get_etudiant_me', security='Bearer')
    @jwt_required()
    def get(self):
        """Profil de l'étudiant connecté"""
        try:
            user_id = get_jwt_identity()
            include_relations = request.args.get('include_relations', 'false').lower() == 'true'
            
            etudiant = etudiant_repo.get_by_user_id(user_id)
            if not etudiant:
                api.abort(404, "Profil étudiant non trouvé")
            
            return etudiant.to_dict(include_relations=include_relations), 200
        except Exception as e:
            logger.error(f"Erreur récupération profil: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:etudiant_id>')
@api.param('etudiant_id', 'ID de l\'étudiant')
class EtudiantDetail(Resource):
    @api.doc('get_etudiant', security='Bearer')
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère un étudiant par son ID"""
        try:
            include_relations = request.args.get('include_relations', 'false').lower() == 'true'
            
            etudiant = etudiant_repo.get_by_id(etudiant_id)
            if not etudiant:
                api.abort(404, f"Étudiant {etudiant_id} non trouvé")
            
            return etudiant.to_dict(include_relations=include_relations), 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('update_etudiant', security='Bearer')
    @api.expect(etudiant_update_model)
    @jwt_required()
    def put(self, etudiant_id):
        """Met à jour un étudiant (admin/étudiant lui-même)"""
        try:
            require_admin_or_self(etudiant_id)
            data = request.get_json()
            
            etudiant = etudiant_repo.get_by_id(etudiant_id)
            if not etudiant:
                api.abort(404, f"Étudiant {etudiant_id} non trouvé")
            
            # Mettre à jour les champs
            if 'numeroEtudiant' in data:
                etudiant.numero_etudiant = data['numeroEtudiant']
            if 'anneeAdmission' in data:
                etudiant.annee_admission = data['anneeAdmission']
            if 'etablissementId' in data:
                etudiant.etablissement_id = data['etablissementId']
            if 'mentionId' in data:
                etudiant.mention_id = data['mentionId']
            if 'parcoursId' in data:
                etudiant.parcours_id = data['parcoursId']
            if 'niveauId' in data:
                etudiant.niveau_id = data['niveauId']
            if 'actif' in data:
                etudiant.actif = data['actif']
            
            from app import db
            db.session.commit()
            
            return etudiant.to_dict(), 200
        except Exception as e:
            logger.error(f"Erreur mise à jour étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('delete_etudiant', security='Bearer')
    @jwt_required()
    def delete(self, etudiant_id):
        """Supprime un étudiant (admin only)"""
        try:
            require_admin()
            
            etudiant = etudiant_repo.get_by_id(etudiant_id)
            if not etudiant:
                api.abort(404, f"Étudiant {etudiant_id} non trouvé")
            
            from app import db
            db.session.delete(etudiant)
            db.session.commit()
            
            return {'message': 'Étudiant supprimé avec succès'}, 200
        except Exception as e:
            logger.error(f"Erreur suppression étudiant: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:etudiant_id>/matieres')
@api.param('etudiant_id', 'ID de l\'étudiant')
class EtudiantMatieres(Resource):
    @api.doc('get_etudiant_matieres', security='Bearer')
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les matières de l'étudiant"""
        try:
            matieres = etudiant_repo.get_matieres(etudiant_id)
            return [m.to_dict() for m in matieres], 200
        except Exception as e:
            logger.error(f"Erreur récupération matières: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:etudiant_id>/matieres/<string:matiere_id>')
@api.param('etudiant_id', 'ID de l\'étudiant')
@api.param('matiere_id', 'ID de la matière')
class EtudiantMatiereAssignment(Resource):
    @api.doc('enroll_matiere', security='Bearer')
    @jwt_required()
    def post(self, etudiant_id, matiere_id):
        """Inscrit l'étudiant à une matière"""
        try:
            require_admin_or_self(etudiant_id)
            success = etudiant_repo.add_matiere(etudiant_id, matiere_id)
            if success:
                return {'message': 'Inscription à la matière réussie'}, 200
            api.abort(400, "Impossible d'inscrire à la matière")
        except Exception as e:
            logger.error(f"Erreur inscription matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")

    @api.doc('unenroll_matiere', security='Bearer')
    @jwt_required()
    def delete(self, etudiant_id, matiere_id):
        """Désinscrit l'étudiant d'une matière"""
        try:
            require_admin_or_self(etudiant_id)
            success = etudiant_repo.remove_matiere(etudiant_id, matiere_id)
            if success:
                return {'message': 'Désinscription de la matière réussie'}, 200
            api.abort(400, "Impossible de désinscrire de la matière")
        except Exception as e:
            logger.error(f"Erreur désinscription matière: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:etudiant_id>/classes')
@api.param('etudiant_id', 'ID de l\'étudiant')
class EtudiantClasses(Resource):
    @api.doc('get_etudiant_classes', security='Bearer')
    @jwt_required()
    def get(self, etudiant_id):
        """Récupère les classes de l'étudiant"""
        try:
            classes = etudiant_repo.get_classes(etudiant_id)
            return [c.to_dict() for c in classes], 200
        except Exception as e:
            logger.error(f"Erreur récupération classes: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/<string:etudiant_id>/classes/<string:classe_id>')
@api.param('etudiant_id', 'ID de l\'étudiant')
@api.param('classe_id', 'ID de la classe')
class EtudiantClasseAssignment(Resource):
    @api.doc('assign_classe', security='Bearer')
    @jwt_required()
    def post(self, etudiant_id, classe_id):
        """Inscrit l'étudiant à une classe"""
        try:
            require_admin_or_self(etudiant_id)
            success = etudiant_repo.add_classe(etudiant_id, classe_id)
            if success:
                return {'message': 'Inscription à la classe réussie'}, 200
            api.abort(400, "Impossible d'inscrire à la classe")
        except Exception as e:
            logger.error(f"Erreur inscription classe: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/mention/<string:mention_id>')
@api.param('mention_id', 'ID de la mention')
class EtudiantByMention(Resource):
    @api.doc('get_etudiants_by_mention', security='Bearer')
    @jwt_required()
    def get(self, mention_id):
        """Récupère les étudiants d'une mention"""
        try:
            etudiants = etudiant_repo.get_by_mention(mention_id)
            return [e.to_dict() for e in etudiants], 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiants par mention: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/parcours/<string:parcours_id>')
@api.param('parcours_id', 'ID du parcours')
class EtudiantByParcours(Resource):
    @api.doc('get_etudiants_by_parcours', security='Bearer')
    @jwt_required()
    def get(self, parcours_id):
        """Récupère les étudiants d'un parcours"""
        try:
            etudiants = etudiant_repo.get_by_parcours(parcours_id)
            return [e.to_dict() for e in etudiants], 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiants par parcours: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")


@api.route('/niveau/<string:niveau_id>')
@api.param('niveau_id', 'ID du niveau')
class EtudiantByNiveau(Resource):
    @api.doc('get_etudiants_by_niveau', security='Bearer')
    @jwt_required()
    def get(self, niveau_id):
        """Récupère les étudiants d'un niveau"""
        try:
            etudiants = etudiant_repo.get_by_niveau(niveau_id)
            return [e.to_dict() for e in etudiants], 200
        except Exception as e:
            logger.error(f"Erreur récupération étudiants par niveau: {e}", exc_info=True)
            api.abort(500, f"Erreur interne: {str(e)}")
