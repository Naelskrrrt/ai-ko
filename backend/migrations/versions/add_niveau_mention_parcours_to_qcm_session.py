"""add niveau mention parcours to qcm and session

Revision ID: add_niveau_mention_parcours
Revises: c0e190b74a6e
Create Date: 2025-01-21

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_niveau_mention_parcours'
down_revision = 'c0e190b74a6e'
branch_labels = None
depends_on = None


def upgrade():
    # Détecter le type de base de données
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == 'sqlite'
    
    # Vérifier si les tables existent avant d'ajouter les foreign keys
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    niveaux_exists = 'niveaux' in tables
    mentions_exists = 'mentions' in tables
    parcours_exists = 'parcours' in tables
    
    # Ajouter les colonnes à la table qcms
    op.add_column('qcms', sa.Column('niveau_id', sa.String(36), nullable=True))
    op.add_column('qcms', sa.Column('mention_id', sa.String(36), nullable=True))
    op.add_column('qcms', sa.Column('parcours_id', sa.String(36), nullable=True))
    
    # Créer les index pour qcms
    op.create_index('ix_qcms_niveau_id', 'qcms', ['niveau_id'])
    op.create_index('ix_qcms_mention_id', 'qcms', ['mention_id'])
    op.create_index('ix_qcms_parcours_id', 'qcms', ['parcours_id'])
    
    # Ajouter les foreign keys pour qcms si les tables existent
    if niveaux_exists:
        op.create_foreign_key(
            'fk_qcms_niveau_id',
            'qcms', 'niveaux',
            ['niveau_id'], ['id'],
            ondelete='SET NULL'
        )
    
    if mentions_exists:
        op.create_foreign_key(
            'fk_qcms_mention_id',
            'qcms', 'mentions',
            ['mention_id'], ['id'],
            ondelete='SET NULL'
        )
    
    if parcours_exists:
        op.create_foreign_key(
            'fk_qcms_parcours_id',
            'qcms', 'parcours',
            ['parcours_id'], ['id'],
            ondelete='SET NULL'
        )
    
    # Ajouter les colonnes à la table sessions_examen
    op.add_column('sessions_examen', sa.Column('niveau_id', sa.String(36), nullable=True))
    op.add_column('sessions_examen', sa.Column('mention_id', sa.String(36), nullable=True))
    op.add_column('sessions_examen', sa.Column('parcours_id', sa.String(36), nullable=True))
    
    # Créer les index pour sessions_examen
    op.create_index('ix_sessions_examen_niveau_id', 'sessions_examen', ['niveau_id'])
    op.create_index('ix_sessions_examen_mention_id', 'sessions_examen', ['mention_id'])
    op.create_index('ix_sessions_examen_parcours_id', 'sessions_examen', ['parcours_id'])
    
    # Ajouter les foreign keys pour sessions_examen si les tables existent
    if niveaux_exists:
        op.create_foreign_key(
            'fk_sessions_examen_niveau_id',
            'sessions_examen', 'niveaux',
            ['niveau_id'], ['id'],
            ondelete='SET NULL'
        )
    
    if mentions_exists:
        op.create_foreign_key(
            'fk_sessions_examen_mention_id',
            'sessions_examen', 'mentions',
            ['mention_id'], ['id'],
            ondelete='SET NULL'
        )
    
    if parcours_exists:
        op.create_foreign_key(
            'fk_sessions_examen_parcours_id',
            'sessions_examen', 'parcours',
            ['parcours_id'], ['id'],
            ondelete='SET NULL'
        )


def downgrade():
    # Supprimer les foreign keys et index pour sessions_examen
    try:
        op.drop_constraint('fk_sessions_examen_parcours_id', 'sessions_examen', type_='foreignkey')
    except:
        pass
    
    try:
        op.drop_constraint('fk_sessions_examen_mention_id', 'sessions_examen', type_='foreignkey')
    except:
        pass
    
    try:
        op.drop_constraint('fk_sessions_examen_niveau_id', 'sessions_examen', type_='foreignkey')
    except:
        pass
    
    op.drop_index('ix_sessions_examen_parcours_id', table_name='sessions_examen')
    op.drop_index('ix_sessions_examen_mention_id', table_name='sessions_examen')
    op.drop_index('ix_sessions_examen_niveau_id', table_name='sessions_examen')
    
    op.drop_column('sessions_examen', 'parcours_id')
    op.drop_column('sessions_examen', 'mention_id')
    op.drop_column('sessions_examen', 'niveau_id')
    
    # Supprimer les foreign keys et index pour qcms
    try:
        op.drop_constraint('fk_qcms_parcours_id', 'qcms', type_='foreignkey')
    except:
        pass
    
    try:
        op.drop_constraint('fk_qcms_mention_id', 'qcms', type_='foreignkey')
    except:
        pass
    
    try:
        op.drop_constraint('fk_qcms_niveau_id', 'qcms', type_='foreignkey')
    except:
        pass
    
    op.drop_index('ix_qcms_parcours_id', table_name='qcms')
    op.drop_index('ix_qcms_mention_id', table_name='qcms')
    op.drop_index('ix_qcms_niveau_id', table_name='qcms')
    
    op.drop_column('qcms', 'parcours_id')
    op.drop_column('qcms', 'mention_id')
    op.drop_column('qcms', 'niveau_id')

