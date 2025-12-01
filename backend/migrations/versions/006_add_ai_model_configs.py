"""add_ai_model_configs_table

Revision ID: 006_add_ai_model_configs
Revises: 005_add_qcm_fields
Create Date: 2025-01-29

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers
revision = '006'
down_revision = '85d8a335ddf0'
branch_labels = None
depends_on = None


def upgrade():
    # Créer la table ai_model_configs
    op.create_table(
        'ai_model_configs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('nom', sa.String(100), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('model_id', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('api_url', sa.String(500), nullable=True),
        sa.Column('max_tokens', sa.Integer, default=2048),
        sa.Column('temperature', sa.Float, default=0.7),
        sa.Column('top_p', sa.Float, default=0.9),
        sa.Column('timeout_seconds', sa.Integer, default=60),
        sa.Column('actif', sa.Boolean, default=True, nullable=False),
        sa.Column('est_defaut', sa.Boolean, default=False, nullable=False),
        sa.Column('ordre_priorite', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime, nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow),
    )


def downgrade():
    # Supprimer la table ai_model_configs
    op.drop_table('ai_model_configs')

