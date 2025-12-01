"""
Modèle Établissement pour les institutions d'enseignement
"""
from datetime import datetime
from app import db
import uuid


class Etablissement(db.Model):
    """Modèle pour les établissements d'enseignement"""
    __tablename__ = 'etablissements'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)  # Ex: UDM, UNIV-PAR
    nom = db.Column(db.String(200), nullable=False)  # Ex: Université de Madagascar
    nom_court = db.Column(db.String(100), nullable=True)  # Ex: UDM
    description = db.Column(db.Text, nullable=True)
    type_etablissement = db.Column(db.String(50), nullable=False)  # université, école, institut
    
    # Coordonnées
    adresse = db.Column(db.Text, nullable=True)
    ville = db.Column(db.String(100), nullable=True)
    pays = db.Column(db.String(100), nullable=False, default='Madagascar')
    code_postal = db.Column(db.String(20), nullable=True)
    telephone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(255), nullable=True)
    site_web = db.Column(db.String(255), nullable=True)
    
    # UI
    logo = db.Column(db.String(500), nullable=True)  # URL du logo
    couleur_primaire = db.Column(db.String(7), nullable=True)  # Hex color
    
    actif = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations (seront définies après les autres modèles)
    mentions = db.relationship('Mention', back_populates='etablissement', lazy='dynamic', cascade='all, delete-orphan')
    enseignants = db.relationship('Enseignant', back_populates='etablissement', lazy='dynamic', cascade='all, delete-orphan')
    etudiants = db.relationship('Etudiant', back_populates='etablissement', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        """Convertit l'établissement en dictionnaire"""
        return {
            'id': self.id,
            'code': self.code,
            'nom': self.nom,
            'nomCourt': self.nom_court,
            'description': self.description,
            'typeEtablissement': self.type_etablissement,
            'adresse': self.adresse,
            'ville': self.ville,
            'pays': self.pays,
            'codePostal': self.code_postal,
            'telephone': self.telephone,
            'email': self.email,
            'siteWeb': self.site_web,
            'logo': self.logo,
            'couleurPrimaire': self.couleur_primaire,
            'actif': self.actif,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<Etablissement {self.code} - {self.nom}>'

