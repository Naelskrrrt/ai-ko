"""add user profile fields

Revision ID: 004
Revises: 003
Create Date: 2025-01-21

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Détecter le type de base de données
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == 'sqlite'
    
    # Ajouter les colonnes manquantes à la table users
    op.add_column('users', sa.Column('numero_etudiant', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('numero_enseignant', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('telephone', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('adresse', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('date_naissance', sa.Date(), nullable=True))
    
    # Créer les index uniques pour numero_etudiant et numero_enseignant
    # PostgreSQL et SQLite gèrent les NULL dans les index uniques (plusieurs NULL sont autorisés)
    op.create_index('ix_users_numero_etudiant', 'users', ['numero_etudiant'], unique=True)
    op.create_index('ix_users_numero_enseignant', 'users', ['numero_enseignant'], unique=True)


def downgrade():
    # Supprimer les index
    op.drop_index('ix_users_numero_enseignant', table_name='users')
    op.drop_index('ix_users_numero_etudiant', table_name='users')
    
    # Supprimer les colonnes
    op.drop_column('users', 'date_naissance')
    op.drop_column('users', 'adresse')
    op.drop_column('users', 'telephone')
    op.drop_column('users', 'numero_enseignant')
    op.drop_column('users', 'numero_etudiant')

