"""add qcm fields matiere_id difficulty_level est_public

Revision ID: 005
Revises: 004
Create Date: 2025-01-21

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    # Détecter le type de base de données
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == 'sqlite'
    
    # Vérifier si la table matieres existe avant d'ajouter la foreign key
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    matieres_exists = 'matieres' in tables
    
    # Ajouter les colonnes manquantes à la table qcms
    op.add_column('qcms', sa.Column('matiere_id', sa.String(36), nullable=True))
    op.add_column('qcms', sa.Column('difficulty_level', sa.String(20), nullable=True))
    op.add_column('qcms', sa.Column('est_public', sa.Boolean(), nullable=False, server_default=sa.text('false') if not is_sqlite else '0'))
    
    # Créer l'index pour matiere_id
    op.create_index('ix_qcms_matiere_id', 'qcms', ['matiere_id'])
    
    # Ajouter la foreign key seulement si la table matieres existe
    if matieres_exists:
        op.create_foreign_key(
            'fk_qcms_matiere_id',
            'qcms', 'matieres',
            ['matiere_id'], ['id'],
            ondelete='SET NULL'
        )


def downgrade():
    # Supprimer la foreign key si elle existe
    try:
        op.drop_constraint('fk_qcms_matiere_id', 'qcms', type_='foreignkey')
    except:
        pass  # La contrainte n'existe peut-être pas
    
    # Supprimer l'index
    op.drop_index('ix_qcms_matiere_id', table_name='qcms')
    
    # Supprimer les colonnes
    op.drop_column('qcms', 'est_public')
    op.drop_column('qcms', 'difficulty_level')
    op.drop_column('qcms', 'matiere_id')

