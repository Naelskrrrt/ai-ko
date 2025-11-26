"""add role column to users

Revision ID: 002
Revises: 001
Create Date: 2025-01-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Détecter le type de base de données
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == 'sqlite'
    is_postgres = bind.dialect.name == 'postgresql'
    
    # Créer le type enum pour PostgreSQL
    if is_postgres:
        # Vérifier si le type enum existe déjà
        connection = bind.connect()
        result = connection.execute(sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'userrole'
            )
        """))
        enum_exists = result.scalar()
        connection.close()
        
        # Créer le type enum seulement s'il n'existe pas
        if not enum_exists:
            op.execute("CREATE TYPE userrole AS ENUM ('admin', 'enseignant', 'etudiant')")
        
        # Ajouter la colonne avec le type enum
        op.add_column('users', sa.Column('role', sa.Enum('admin', 'enseignant', 'etudiant', name='userrole', create_type=False), nullable=False, server_default='admin'))
        
        # Mettre à jour tous les utilisateurs existants pour qu'ils aient le rôle admin
        op.execute("UPDATE users SET role = 'admin'::userrole WHERE role IS NULL")
    elif is_sqlite:
        # SQLite ne supporte pas les enums natifs, utiliser String
        op.add_column('users', sa.Column('role', sa.String(20), nullable=False, server_default='admin'))
        # Mettre à jour tous les utilisateurs existants
        op.execute("UPDATE users SET role = 'admin' WHERE role IS NULL OR role = ''")
    else:
        # Autres bases de données
        op.add_column('users', sa.Column('role', sa.String(20), nullable=False, server_default='admin'))
        op.execute("UPDATE users SET role = 'admin' WHERE role IS NULL OR role = ''")


def downgrade():
    # Détecter le type de base de données
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'
    
    # Supprimer la colonne
    op.drop_column('users', 'role')
    
    # Supprimer le type enum pour PostgreSQL
    if is_postgres:
        op.execute("DROP TYPE IF EXISTS userrole")

