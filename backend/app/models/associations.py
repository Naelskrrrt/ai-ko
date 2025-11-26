"""
Tables d'association pour les relations many-to-many
"""
from app import db

# Association Professeur <-> Matières
professeur_matieres = db.Table(
    'professeur_matieres',
    db.Column('professeur_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('matiere_id', db.String(36), db.ForeignKey('matieres.id'), primary_key=True),
    db.Column('annee_scolaire', db.String(20), nullable=True),  # Peut enseigner une matière certaines années seulement
    db.Column('created_at', db.DateTime, server_default=db.func.now())
)

# Association Professeur <-> Niveaux
professeur_niveaux = db.Table(
    'professeur_niveaux',
    db.Column('professeur_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('niveau_id', db.String(36), db.ForeignKey('niveaux.id'), primary_key=True),
    db.Column('created_at', db.DateTime, server_default=db.func.now())
)

# Association Étudiant <-> Niveaux (un étudiant peut redoubler ou changer de niveau)
etudiant_niveaux = db.Table(
    'etudiant_niveaux',
    db.Column('etudiant_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('niveau_id', db.String(36), db.ForeignKey('niveaux.id'), primary_key=True),
    db.Column('annee_scolaire', db.String(20), nullable=False),  # Ex: 2024-2025
    db.Column('est_actuel', db.Boolean, default=True),  # Niveau actuel ou passé
    db.Column('created_at', db.DateTime, server_default=db.func.now())
)

# Association Étudiant <-> Classes
etudiant_classes = db.Table(
    'etudiant_classes',
    db.Column('etudiant_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('classe_id', db.String(36), db.ForeignKey('classes.id'), primary_key=True),
    db.Column('annee_scolaire', db.String(20), nullable=False),
    db.Column('est_actuelle', db.Boolean, default=True),
    db.Column('created_at', db.DateTime, server_default=db.func.now())
)

# Association Étudiant <-> Matières
etudiant_matieres = db.Table(
    'etudiant_matieres',
    db.Column('etudiant_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('matiere_id', db.String(36), db.ForeignKey('matieres.id'), primary_key=True),
    db.Column('annee_scolaire', db.String(20), nullable=False),
    db.Column('est_actuelle', db.Boolean, default=True),
    db.Column('created_at', db.DateTime, server_default=db.func.now())
)

# Association Professeur <-> Classes (un professeur peut enseigner à plusieurs classes)
professeur_classes = db.Table(
    'professeur_classes',
    db.Column('professeur_id', db.String(36), db.ForeignKey('users.id'), primary_key=True),
    db.Column('classe_id', db.String(36), db.ForeignKey('classes.id'), primary_key=True),
    db.Column('matiere_id', db.String(36), db.ForeignKey('matieres.id'), nullable=True),  # Matière enseignée
    db.Column('annee_scolaire', db.String(20), nullable=False),
    db.Column('created_at', db.DateTime, server_default=db.func.now())
)

# Association QCM <-> Niveaux (un QCM peut cibler plusieurs niveaux)
qcm_niveaux = db.Table(
    'qcm_niveaux',
    db.Column('qcm_id', db.String(36), db.ForeignKey('qcms.id'), primary_key=True),
    db.Column('niveau_id', db.String(36), db.ForeignKey('niveaux.id'), primary_key=True),
    db.Column('created_at', db.DateTime, server_default=db.func.now())
)
