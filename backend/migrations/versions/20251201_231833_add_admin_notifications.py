"""add_admin_notifications

Revision ID: 20251201_231833
Revises: 20251201_231823
Create Date: 2025-12-01 23:18:33

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers
revision = '20251201_231833'
down_revision = '20251201_231823'
branch_labels = None
depends_on = None


def upgrade():
    # Créer la table admin_notifications
    op.create_table(
        'admin_notifications',
        sa.Column('id', sa.String(36), primary_key=True, nullable=False),
        sa.Column('type', sa.String(50), nullable=False),  # 'pending_user', 'pending_validation', etc.
        sa.Column('target_user_id', sa.String(36), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('is_read', sa.Boolean, nullable=False, default=False, server_default='false'),
        sa.Column('created_at', sa.DateTime, nullable=False, default=datetime.utcnow),
        sa.ForeignKeyConstraint(['target_user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Créer les index pour optimiser les requêtes
    op.create_index('idx_admin_notifications_is_read', 'admin_notifications', ['is_read'])
    op.create_index('idx_admin_notifications_type', 'admin_notifications', ['type'])
    op.create_index('idx_admin_notifications_created_at', 'admin_notifications', ['created_at'])


def downgrade():
    # Supprimer les index
    op.drop_index('idx_admin_notifications_created_at', table_name='admin_notifications')
    op.drop_index('idx_admin_notifications_type', table_name='admin_notifications')
    op.drop_index('idx_admin_notifications_is_read', table_name='admin_notifications')

    # Supprimer la table
    op.drop_table('admin_notifications')
