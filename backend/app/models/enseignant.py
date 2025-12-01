"""
Modèle Enseignant séparé de User
"""
from datetime import datetime
from app import db
import uuid


class Enseignant(db.Model):
    """Modèle pour les enseignants/professeurs"""
    __tablename__ = 'enseignants'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Référence vers User (authentification)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    user = db.relationship('User', backref=db.backref('enseignant_profil', uselist=False))
    
    # Informations spécifiques enseignant
    numero_enseignant = db.Column(db.String(50), unique=True, nullable=False, index=True)
    grade = db.Column(db.String(100), nullable=True)  # Maître de conférence, Professeur, etc.
    specialite = db.Column(db.String(200), nullable=True)
    departement = db.Column(db.String(200), nullable=True)
    bureau = db.Column(db.String(100), nullable=True)  # Numéro de bureau
    horaires_disponibilite = db.Column(db.Text, nullable=True)  # JSON ou texte libre
    
    # Référence à l'établissement
    etablissement_id = db.Column(db.String(36), db.ForeignKey('etablissements.id'), nullable=False)
    etablissement = db.relationship('Etablissement', back_populates='enseignants')
    
    # Dates
    date_embauche = db.Column(db.Date, nullable=True)
    actif = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations Many-to-Many
    matieres = db.relationship(
        'Matiere',
        secondary='enseignant_matieres',
        backref='enseignants',
        lazy='dynamic'
    )
    
    niveaux = db.relationship(
        'Niveau',
        secondary='enseignant_niveaux',
        backref='enseignants',
        lazy='dynamic'
    )
    
    parcours = db.relationship(
        'Parcours',
        secondary='enseignant_parcours',
        backref='enseignants',
        lazy='dynamic'
    )
    
    mentions = db.relationship(
        'Mention',
        secondary='enseignant_mentions',
        backref='enseignants',
        lazy='dynamic'
    )

    def to_dict(self, include_relations=False):
        """Convertit l'enseignant en dictionnaire"""
        data = {
            'id': self.id,
            'userId': self.user_id,
            'numeroEnseignant': self.numero_enseignant,
            'grade': self.grade,
            'specialite': self.specialite,
            'departement': self.departement,
            'bureau': self.bureau,
            'horairesDisponibilite': self.horaires_disponibilite,
            'etablissementId': self.etablissement_id,
            'etablissement': self.etablissement.to_dict() if self.etablissement else None,
            'dateEmbauche': self.date_embauche.isoformat() if self.date_embauche else None,
            'actif': self.actif,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }
        
        # Infos user
        if self.user:
            data['email'] = self.user.email
            data['name'] = self.user.name
            data['avatar'] = self.user.avatar
            data['telephone'] = self.user.telephone
            data['adresse'] = self.user.adresse
        
        if include_relations:
            # Convertir les relations lazy='dynamic' en listes
            data['matieres'] = [m.to_dict() for m in list(self.matieres)]
            data['niveaux'] = [n.to_dict() for n in list(self.niveaux)]
            data['parcours'] = [p.to_dict(include_mention=False) for p in list(self.parcours)]
            data['mentions'] = [m.to_dict(include_etablissement=False) for m in list(self.mentions)]
        
        return data

    def __repr__(self):
        return f'<Enseignant {self.numero_enseignant} - {self.user.name if self.user else "N/A"}>'

