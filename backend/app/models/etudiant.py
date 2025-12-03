"""
Modèle Etudiant séparé de User
"""
from datetime import datetime
from app import db
import uuid


class Etudiant(db.Model):
    """Modèle pour les étudiants"""
    __tablename__ = 'etudiants'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Référence vers User (authentification)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True, index=True)
    user = db.relationship('User', backref=db.backref('etudiant_profil', uselist=False))
    
    # Informations spécifiques étudiant
    numero_etudiant = db.Column(db.String(50), unique=True, nullable=False, index=True)
    annee_admission = db.Column(db.String(20), nullable=True)  # 2024-2025
    
    # Référence à l'établissement
    etablissement_id = db.Column(db.String(36), db.ForeignKey('etablissements.id'), nullable=False)
    etablissement = db.relationship('Etablissement', back_populates='etudiants')
    
    # Référence à la mention (UNE seule mention active)
    mention_id = db.Column(db.String(36), db.ForeignKey('mentions.id'), nullable=True)
    mention = db.relationship('Mention')
    
    # Référence au parcours (UN seul parcours actif)
    parcours_id = db.Column(db.String(36), db.ForeignKey('parcours.id'), nullable=True)
    parcours = db.relationship('Parcours')
    
    # Référence au niveau (UN seul niveau actif)
    niveau_id = db.Column(db.String(36), db.ForeignKey('niveaux.id'), nullable=True)
    niveau = db.relationship('Niveau')
    
    actif = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations Many-to-Many
    matieres = db.relationship(
        'Matiere',
        secondary='etudiant_matieres_v2',
        backref='etudiants_v2',
        lazy='dynamic'
    )
    
    classes = db.relationship(
        'Classe',
        secondary='etudiant_classes_v2',
        backref='etudiants_v2',
        lazy='dynamic'
    )

    def to_dict(self, include_relations=False):
        """Convertit l'étudiant en dictionnaire"""
        data = {
            'id': self.id,
            'userId': self.user_id,
            'numeroEtudiant': self.numero_etudiant,
            'anneeAdmission': self.annee_admission,
            'etablissementId': self.etablissement_id,
            'etablissement': self.etablissement.to_dict() if self.etablissement else None,
            'mentionId': self.mention_id,
            'mention': self.mention.to_dict(include_etablissement=False) if self.mention else None,
            'parcoursId': self.parcours_id,
            'parcours': self.parcours.to_dict(include_mention=False) if self.parcours else None,
            'niveauId': self.niveau_id,
            'niveau': self.niveau.to_dict() if self.niveau else None,
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
            data['dateNaissance'] = self.user.date_naissance.isoformat() if self.user.date_naissance else None
        
        if include_relations:
            data['matieres'] = [m.to_dict() for m in self.matieres]
            data['classes'] = [c.to_dict() for c in self.classes]
        
        return data

    def __repr__(self):
        return f'<Etudiant {self.numero_etudiant} - {self.user.name if self.user else "N/A"}>'




