"""Refonte - Séparation Enseignants et Étudiants

Revision ID: 007_refonte_enseignant_etudiant
Revises: 006_add_ai_model_configs
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_refonte_enseignant_etudiant'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    """
    Crée les nouvelles tables pour la refonte du modèle enseignant/étudiant
    """
    # 1. Créer la table etablissements
    op.create_table('etablissements',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('nom', sa.String(length=200), nullable=False),
        sa.Column('nom_court', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type_etablissement', sa.String(length=50), nullable=False),
        sa.Column('adresse', sa.Text(), nullable=True),
        sa.Column('ville', sa.String(length=100), nullable=True),
        sa.Column('pays', sa.String(length=100), nullable=False),
        sa.Column('code_postal', sa.String(length=20), nullable=True),
        sa.Column('telephone', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('site_web', sa.String(length=255), nullable=True),
        sa.Column('logo', sa.String(length=500), nullable=True),
        sa.Column('couleur_primaire', sa.String(length=7), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_etablissements_code'), 'etablissements', ['code'], unique=True)

    # 2. Créer la table mentions
    op.create_table('mentions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('nom', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('etablissement_id', sa.String(length=36), nullable=False),
        sa.Column('couleur', sa.String(length=7), nullable=True),
        sa.Column('icone', sa.String(length=50), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['etablissement_id'], ['etablissements.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_mentions_code'), 'mentions', ['code'], unique=True)

    # 3. Créer la table parcours
    op.create_table('parcours',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('nom', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('mention_id', sa.String(length=36), nullable=False),
        sa.Column('duree_annees', sa.Integer(), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['mention_id'], ['mentions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_parcours_code'), 'parcours', ['code'], unique=True)

    # 4. Créer la table enseignants
    op.create_table('enseignants',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('numero_enseignant', sa.String(length=50), nullable=False),
        sa.Column('grade', sa.String(length=100), nullable=True),
        sa.Column('specialite', sa.String(length=200), nullable=True),
        sa.Column('departement', sa.String(length=200), nullable=True),
        sa.Column('bureau', sa.String(length=100), nullable=True),
        sa.Column('horaires_disponibilite', sa.Text(), nullable=True),
        sa.Column('etablissement_id', sa.String(length=36), nullable=False),
        sa.Column('date_embauche', sa.Date(), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['etablissement_id'], ['etablissements.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('numero_enseignant')
    )
    op.create_index(op.f('ix_enseignants_numero_enseignant'), 'enseignants', ['numero_enseignant'], unique=True)
    op.create_index(op.f('ix_enseignants_user_id'), 'enseignants', ['user_id'], unique=True)

    # 5. Créer la table etudiants
    op.create_table('etudiants',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('numero_etudiant', sa.String(length=50), nullable=False),
        sa.Column('annee_admission', sa.String(length=20), nullable=True),
        sa.Column('etablissement_id', sa.String(length=36), nullable=False),
        sa.Column('mention_id', sa.String(length=36), nullable=True),
        sa.Column('parcours_id', sa.String(length=36), nullable=True),
        sa.Column('niveau_id', sa.String(length=36), nullable=True),
        sa.Column('actif', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['etablissement_id'], ['etablissements.id'], ),
        sa.ForeignKeyConstraint(['mention_id'], ['mentions.id'], ),
        sa.ForeignKeyConstraint(['niveau_id'], ['niveaux.id'], ),
        sa.ForeignKeyConstraint(['parcours_id'], ['parcours.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('numero_etudiant')
    )
    op.create_index(op.f('ix_etudiants_numero_etudiant'), 'etudiants', ['numero_etudiant'], unique=True)
    op.create_index(op.f('ix_etudiants_user_id'), 'etudiants', ['user_id'], unique=True)

    # 6. Créer les tables d'association pour Enseignant
    op.create_table('enseignant_matieres',
        sa.Column('enseignant_id', sa.String(length=36), nullable=False),
        sa.Column('matiere_id', sa.String(length=36), nullable=False),
        sa.Column('annee_scolaire', sa.String(length=20), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['enseignant_id'], ['enseignants.id'], ),
        sa.ForeignKeyConstraint(['matiere_id'], ['matieres.id'], ),
        sa.PrimaryKeyConstraint('enseignant_id', 'matiere_id')
    )

    op.create_table('enseignant_niveaux',
        sa.Column('enseignant_id', sa.String(length=36), nullable=False),
        sa.Column('niveau_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['enseignant_id'], ['enseignants.id'], ),
        sa.ForeignKeyConstraint(['niveau_id'], ['niveaux.id'], ),
        sa.PrimaryKeyConstraint('enseignant_id', 'niveau_id')
    )

    op.create_table('enseignant_parcours',
        sa.Column('enseignant_id', sa.String(length=36), nullable=False),
        sa.Column('parcours_id', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['enseignant_id'], ['enseignants.id'], ),
        sa.ForeignKeyConstraint(['parcours_id'], ['parcours.id'], ),
        sa.PrimaryKeyConstraint('enseignant_id', 'parcours_id')
    )

    op.create_table('enseignant_mentions',
        sa.Column('enseignant_id', sa.String(length=36), nullable=False),
        sa.Column('mention_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['enseignant_id'], ['enseignants.id'], ),
        sa.ForeignKeyConstraint(['mention_id'], ['mentions.id'], ),
        sa.PrimaryKeyConstraint('enseignant_id', 'mention_id')
    )

    # 7. Créer les tables d'association pour Etudiant
    op.create_table('etudiant_matieres_v2',
        sa.Column('etudiant_id', sa.String(length=36), nullable=False),
        sa.Column('matiere_id', sa.String(length=36), nullable=False),
        sa.Column('annee_scolaire', sa.String(length=20), nullable=False),
        sa.Column('semestre', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['etudiant_id'], ['etudiants.id'], ),
        sa.ForeignKeyConstraint(['matiere_id'], ['matieres.id'], ),
        sa.PrimaryKeyConstraint('etudiant_id', 'matiere_id')
    )

    op.create_table('etudiant_classes_v2',
        sa.Column('etudiant_id', sa.String(length=36), nullable=False),
        sa.Column('classe_id', sa.String(length=36), nullable=False),
        sa.Column('annee_scolaire', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['etudiant_id'], ['etudiants.id'], ),
        sa.ForeignKeyConstraint(['classe_id'], ['classes.id'], ),
        sa.PrimaryKeyConstraint('etudiant_id', 'classe_id')
    )

    # NOTE: Les colonnes numero_etudiant et numero_enseignant de la table users
    # ne sont PAS supprimées dans cette migration pour assurer la compatibilité
    # avec les données existantes. Le script de migration de données les utilisera.


def downgrade():
    """
    Supprime les nouvelles tables (rollback)
    """
    # Supprimer les tables d'association en premier (contraintes FK)
    op.drop_table('etudiant_classes_v2')
    op.drop_table('etudiant_matieres_v2')
    op.drop_table('enseignant_mentions')
    op.drop_table('enseignant_parcours')
    op.drop_table('enseignant_niveaux')
    op.drop_table('enseignant_matieres')

    # Supprimer les tables principales
    op.drop_index(op.f('ix_etudiants_user_id'), table_name='etudiants')
    op.drop_index(op.f('ix_etudiants_numero_etudiant'), table_name='etudiants')
    op.drop_table('etudiants')

    op.drop_index(op.f('ix_enseignants_user_id'), table_name='enseignants')
    op.drop_index(op.f('ix_enseignants_numero_enseignant'), table_name='enseignants')
    op.drop_table('enseignants')

    op.drop_index(op.f('ix_parcours_code'), table_name='parcours')
    op.drop_table('parcours')

    op.drop_index(op.f('ix_mentions_code'), table_name='mentions')
    op.drop_table('mentions')

    op.drop_index(op.f('ix_etablissements_code'), table_name='etablissements')
    op.drop_table('etablissements')

