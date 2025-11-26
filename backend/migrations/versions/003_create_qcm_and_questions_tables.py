"""create qcm and questions tables

Revision ID: 003
Revises: 002
Create Date: 2025-01-21

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Détecter le type de base de données
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == 'sqlite'

    # Créer la table qcms
    op.create_table(
        'qcms',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('titre', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duree', sa.Integer(), nullable=True),
        sa.Column('matiere', sa.String(100), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('createur_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['createur_id'], ['users.id'], ),
    )
    op.create_index('ix_qcms_createur_id', 'qcms', ['createur_id'])
    op.create_index('ix_qcms_status', 'qcms', ['status'])

    # Créer la table questions
    op.create_table(
        'questions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('enonce', sa.Text(), nullable=False),
        sa.Column('type_question', sa.String(20), nullable=False, server_default='qcm'),
        sa.Column('options', sa.Text(), nullable=True),
        sa.Column('reponse_correcte', sa.Text(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('explication', sa.Text(), nullable=True),
        sa.Column('qcm_id', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['qcm_id'], ['qcms.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_questions_qcm_id', 'questions', ['qcm_id'])
    op.create_index('ix_questions_type', 'questions', ['type_question'])


def downgrade():
    op.drop_index('ix_questions_type', table_name='questions')
    op.drop_index('ix_questions_qcm_id', table_name='questions')
    op.drop_table('questions')
    op.drop_index('ix_qcms_status', table_name='qcms')
    op.drop_index('ix_qcms_createur_id', table_name='qcms')
    op.drop_table('qcms')
