"""create users table

Revision ID: 001
Revises: 
Create Date: 2025-01-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Détecter le type de base de données
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == 'sqlite'
    
    # Créer la table users
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('google_id', sa.String(255), nullable=True, unique=True),
        sa.Column('avatar', sa.String(500), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.text('false') if not is_sqlite else '0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_google_id', 'users', ['google_id'])


def downgrade():
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')

