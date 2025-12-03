"""add_user_activation

Revision ID: 20251201_231823
Revises: 006_add_ai_model_configs
Create Date: 2025-12-01 23:18:23

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20251201_231823'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Ajouter la colonne is_active à la table users
    op.add_column('users', sa.Column('is_active', sa.Boolean(), nullable=False, default=False, server_default='false'))

    # Créer un index sur is_active pour optimiser les requêtes
    op.create_index('idx_users_is_active', 'users', ['is_active'])

    # Mettre à jour tous les utilisateurs existants pour qu'ils soient actifs
    # Cela évite de bloquer les comptes existants lors de la migration
    op.execute("UPDATE users SET is_active = true")


def downgrade():
    # Supprimer l'index
    op.drop_index('idx_users_is_active', table_name='users')

    # Supprimer la colonne is_active
    op.drop_column('users', 'is_active')
