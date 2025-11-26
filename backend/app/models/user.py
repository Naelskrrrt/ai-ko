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

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)  # Nullable pour OAuth
    
    # Rôle utilisateur - utiliser TypeDecorator personnalisé pour éviter les problèmes d'enum
    role = db.Column(UserRoleType(), default=UserRole.ADMIN, nullable=False)
    
    # OAuth fields
    google_id = db.Column(db.String(255), unique=True, nullable=True, index=True)
    avatar = db.Column(db.String(500), nullable=True)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    
    # Informations complémentaires pour les étudiants/professeurs
    numero_etudiant = db.Column(db.String(50), unique=True, nullable=True, index=True)  # Numéro d'étudiant
    numero_enseignant = db.Column(db.String(50), unique=True, nullable=True, index=True)  # Numéro d'enseignant
    telephone = db.Column(db.String(20), nullable=True)
    adresse = db.Column(db.Text, nullable=True)
    date_naissance = db.Column(db.Date, nullable=True)

    # Relations many-to-many (seront définies après l'import des tables d'association)
    # Pour les professeurs
    matieres_enseignees = db.relationship(
        'Matiere',
        secondary='professeur_matieres',
        backref='professeurs',
        lazy='dynamic'
    )

    niveaux_enseignes = db.relationship(
        'Niveau',
        secondary='professeur_niveaux',
        backref='professeurs',
        lazy='dynamic'
    )

    classes_enseignees = db.relationship(
        'Classe',
        secondary='professeur_classes',
        backref='professeurs',
        lazy='dynamic'
    )

    # Pour les étudiants
    niveaux_etudiants = db.relationship(
        'Niveau',
        secondary='etudiant_niveaux',
        backref='etudiants',
        lazy='dynamic'
    )

    classes_etudiants = db.relationship(
        'Classe',
        secondary='etudiant_classes',
        backref=db.backref('etudiants', lazy='dynamic'),
        lazy='dynamic'
    )

    matieres_etudiees = db.relationship(
        'Matiere',
        secondary='etudiant_matieres',
        backref='etudiants',
        lazy='dynamic'
    )

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def set_password(self, password):
        """Hash et stocke le mot de passe"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Vérifie le mot de passe"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_relations=False):
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
            'numeroEtudiant': self.numero_etudiant,
            'numeroEnseignant': self.numero_enseignant,
            'telephone': self.telephone,
            'dateNaissance': format_date(self.date_naissance),
            'createdAt': format_date(self.created_at),
            'updatedAt': format_date(self.updated_at),
        }

        # Inclure les relations si demandé
        if include_relations:
            # Pour les professeurs
            if self.role == UserRole.ENSEIGNANT or self.role == UserRole.PROFESSEUR:
                data['matieresEnseignees'] = [m.to_dict() for m in self.matieres_enseignees]
                data['niveauxEnseignes'] = [n.to_dict() for n in self.niveaux_enseignes]
                data['classesEnseignees'] = [c.to_dict() for c in self.classes_enseignees]

            # Pour les étudiants
            if self.role == UserRole.ETUDIANT:
                data['niveaux'] = [n.to_dict() for n in self.niveaux_etudiants]
                data['classes'] = [c.to_dict() for c in self.classes_etudiants]
                data['matieres'] = [m.to_dict() for m in self.matieres_etudiees]

        return data
    
    def __repr__(self):
        return f'<User {self.email}>'

