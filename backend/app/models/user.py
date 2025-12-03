"""
Modèle User pour l'authentification
"""
from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import TypeDecorator, String
import uuid
import enum


class UserRole(enum.Enum):
    """Rôles utilisateurs"""
    ADMIN = 'admin'
    ENSEIGNANT = 'enseignant'  # Alias pour PROFESSEUR
    ETUDIANT = 'etudiant'
    PROFESSEUR = 'enseignant'  # Même valeur que ENSEIGNANT

    # Alias pour compatibilité
    USER = 'etudiant'


class UserRoleType(TypeDecorator):
    """Type personnalisé pour mapper UserRole enum vers String"""
    impl = String(20)
    cache_ok = True

    def __init__(self):
        super().__init__(length=20)

    def process_bind_param(self, value, dialect):
        """Convertit UserRole enum vers string pour la base de données"""
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value.value
        return str(value)

    def process_result_value(self, value, dialect):
        """Convertit string de la base de données vers UserRole enum"""
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value
        # Convertir la valeur string vers l'enum
        for role in UserRole:
            if role.value == value:
                return role
        # Si la valeur n'est pas trouvée, retourner ADMIN par défaut
        return UserRole.ADMIN


class User(db.Model):
    """Modèle utilisateur avec support OAuth"""
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True,
                   default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(
        db.String(255), nullable=True)  # Nullable pour OAuth

    # Rôle utilisateur - utiliser TypeDecorator personnalisé pour éviter les problèmes d'enum
    role = db.Column(UserRoleType(), default=UserRole.ADMIN, nullable=False)

    # OAuth fields
    google_id = db.Column(db.String(255), unique=True,
                          nullable=True, index=True)
    avatar = db.Column(db.String(500), nullable=True)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)

    # Informations complémentaires (coordonnées générales)
    telephone = db.Column(db.String(20), nullable=True)
    adresse = db.Column(db.Text, nullable=True)
    date_naissance = db.Column(db.Date, nullable=True)

    # Activation utilisateur (validation admin)
    is_active = db.Column(db.Boolean, default=False, nullable=False)

    # NOTE: Les relations many-to-many ont été déplacées vers les modèles Enseignant et Etudiant
    # Les backref 'enseignant_profil' et 'etudiant_profil' sont définis dans ces modèles

    # Timestamps
    created_at = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False)

    def set_password(self, password):
        """Hash et stocke le mot de passe"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Vérifie le mot de passe"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_profil=False):
        """Convertit l'utilisateur en dictionnaire"""
        
        # Gérer les dates - s'assurer qu'elles sont toujours des objets datetime
        def format_date(date_value):
            if date_value is None:
                return None
            # Si c'est déjà un datetime, formater en ISO
            if isinstance(date_value, datetime):
                return date_value.isoformat()
            # Si c'est une string, essayer de la parser puis formater
            if isinstance(date_value, str):
                try:
                    from dateutil import parser
                    dt = parser.parse(date_value)
                    return dt.isoformat()
                except:
                    return date_value  # Retourner la string telle quelle si parsing échoue
            return str(date_value)

        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role.value if self.role else None,
            'avatar': self.avatar,
            'emailVerified': self.email_verified,
            'telephone': self.telephone,
            'adresse': self.adresse,
            'dateNaissance': format_date(self.date_naissance),
            'isActive': self.is_active,
            'createdAt': format_date(self.created_at),
            'updatedAt': format_date(self.updated_at),
        }

        # Inclure le profil spécifique si demandé
        if include_profil:
            # Pour les enseignants
            if self.role == UserRole.ENSEIGNANT or self.role == UserRole.PROFESSEUR:
                if hasattr(self, 'enseignant_profil') and self.enseignant_profil:
                    data['enseignantProfil'] = self.enseignant_profil.to_dict(
                        include_relations=False)

            # Pour les étudiants
            if self.role == UserRole.ETUDIANT:
                if hasattr(self, 'etudiant_profil') and self.etudiant_profil:
                    data['etudiantProfil'] = self.etudiant_profil.to_dict(
                        include_relations=False)

        return data

    def __repr__(self):
        return f'<User {self.email}>'
