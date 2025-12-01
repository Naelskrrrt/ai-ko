#!/usr/bin/env python3
"""
Script pour synchroniser les données de la base de données locale (Docker PostgreSQL)
vers la base de données de production.

Usage:
    python scripts/sync_db_to_prod.py [--dry-run] [--skip-existing] [--update-existing]
    
Options:
    --dry-run: Affiche ce qui serait fait sans effectuer les modifications
    --skip-existing: Ignore les enregistrements qui existent déjà (par défaut)
    --update-existing: Met à jour les enregistrements existants au lieu de les ignorer
"""

import os
import sys
import argparse
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from urllib.parse import urlparse

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from psycopg2.extras import execute_values, RealDictCursor
from psycopg2 import sql
from dotenv import load_dotenv

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Charger les variables d'environnement
load_dotenv()


class DatabaseSyncer:
    """Classe pour synchroniser les données entre deux bases PostgreSQL"""
    
    # Ordre d'insertion des tables (respect des dépendances)
    TABLE_ORDER = [
        'niveaux',           # Pas de dépendances
        'matieres',          # Pas de dépendances
        'users',             # Pas de dépendances
        'classes',           # Dépend de niveaux
        'questions',         # Dépend de users
        'qcms',              # Dépend de users, matieres
        'session_examens',   # Dépend de users, qcms, classes
        'resultats',         # Dépend de users, session_examens
    ]
    
    # Tables d'association (à traiter après les tables principales)
    ASSOCIATION_TABLES = [
        'professeur_matieres',
        'professeur_niveaux',
        'etudiant_niveaux',
        'etudiant_classes',
        'professeur_classes',
        'qcm_niveaux',
    ]
    
    def __init__(self, local_db_url: str, prod_db_url: str, dry_run: bool = False, 
                 update_existing: bool = False):
        """
        Initialise le synchroniseur de base de données
        
        Args:
            local_db_url: URL de connexion à la base locale (Docker)
            prod_db_url: URL de connexion à la base de production
            dry_run: Si True, n'effectue pas les modifications
            update_existing: Si True, met à jour les enregistrements existants
        """
        self.local_db_url = local_db_url
        self.prod_db_url = prod_db_url
        self.dry_run = dry_run
        self.update_existing = update_existing
        self.local_conn = None
        self.prod_conn = None
        self.stats = {
            'tables_processed': 0,
            'rows_inserted': 0,
            'rows_updated': 0,
            'rows_skipped': 0,
            'errors': 0
        }
    
    def connect(self):
        """Établit les connexions aux bases de données"""
        try:
            logger.info("Connexion à la base de données locale...")
            self.local_conn = psycopg2.connect(self.local_db_url)
            logger.info("✓ Connexion locale établie")
            
            logger.info("Connexion à la base de données de production...")
            self.prod_conn = psycopg2.connect(self.prod_db_url)
            logger.info("✓ Connexion production établie")
            
        except psycopg2.Error as e:
            logger.error(f"Erreur de connexion: {e}")
            raise
    
    def close(self):
        """Ferme les connexions"""
        if self.local_conn:
            self.local_conn.close()
        if self.prod_conn:
            self.prod_conn.close()
        logger.info("Connexions fermées")
    
    def get_table_columns(self, conn, table_name: str) -> List[str]:
        """Récupère la liste des colonnes d'une table"""
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s 
                ORDER BY ordinal_position
            """, (table_name,))
            return [row[0] for row in cur.fetchall()]
    
    def get_primary_key(self, conn, table_name: str) -> Optional[str]:
        """Récupère la clé primaire d'une table"""
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = %s::regclass
                AND i.indisprimary
                LIMIT 1
            """, (table_name,))
            result = cur.fetchone()
            return result[0] if result else None
    
    def table_exists(self, conn, table_name: str) -> bool:
        """Vérifie si une table existe"""
        with conn.cursor() as cur:
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = %s
                )
            """, (table_name,))
            return cur.fetchone()[0]
    
    def get_table_data(self, table_name: str) -> List[Dict[str, Any]]:
        """Récupère toutes les données d'une table depuis la base locale"""
        if not self.table_exists(self.local_conn, table_name):
            logger.warning(f"Table {table_name} n'existe pas dans la base locale")
            return []
        
        columns = self.get_table_columns(self.local_conn, table_name)
        if not columns:
            logger.warning(f"Aucune colonne trouvée pour {table_name}")
            return []
        
        with self.local_conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = sql.SQL("SELECT * FROM {}").format(sql.Identifier(table_name))
            cur.execute(query)
            rows = cur.fetchall()
            return [dict(row) for row in rows]
    
    def row_exists(self, table_name: str, primary_key: str, value: Any) -> bool:
        """Vérifie si un enregistrement existe dans la base de production"""
        with self.prod_conn.cursor() as cur:
            query = sql.SQL("SELECT 1 FROM {} WHERE {} = %s LIMIT 1").format(
                sql.Identifier(table_name),
                sql.Identifier(primary_key)
            )
            cur.execute(query, (value,))
            return cur.fetchone() is not None
    
    def prepare_value(self, value: Any) -> Any:
        """Prépare une valeur pour l'insertion (gestion des types spéciaux)"""
        if value is None:
            return None
        # Convertir les enums en string
        if hasattr(value, 'value'):
            return value.value
        # Convertir les datetime en string ISO
        if isinstance(value, datetime):
            return value.isoformat()
        # Convertir les UUID en string
        if hasattr(value, '__str__') and 'uuid' in str(type(value)).lower():
            return str(value)
        return value
    
    def insert_row(self, table_name: str, row: Dict[str, Any], primary_key: Optional[str] = None):
        """Insère ou met à jour une ligne dans la base de production"""
        if not self.table_exists(self.prod_conn, table_name):
            logger.warning(f"Table {table_name} n'existe pas dans la base de production")
            return False
        
        columns = list(row.keys())
        # Préparer les valeurs (conversion des types spéciaux)
        values = [self.prepare_value(row[col]) for col in columns]
        
        # Préparer les placeholders
        placeholders = ', '.join(['%s'] * len(values))
        column_names = ', '.join([f'"{col}"' for col in columns])
        
        try:
            with self.prod_conn.cursor() as cur:
                if primary_key and self.update_existing:
                    # Mode UPDATE: utiliser INSERT ... ON CONFLICT DO UPDATE
                    pk_value = row.get(primary_key)
                    if pk_value and self.row_exists(table_name, primary_key, pk_value):
                        # Construire la clause SET pour UPDATE
                        set_clause = ', '.join([
                            f'"{col}" = EXCLUDED."{col}"' 
                            for col in columns if col != primary_key
                        ])
                        
                        query = f"""
                            INSERT INTO "{table_name}" ({column_names})
                            VALUES ({placeholders})
                            ON CONFLICT ("{primary_key}") 
                            DO UPDATE SET {set_clause}
                        """
                        cur.execute(query, values)
                        self.stats['rows_updated'] += 1
                        return True
                
                # Mode INSERT simple
                query = f'INSERT INTO "{table_name}" ({column_names}) VALUES ({placeholders})'
                cur.execute(query, values)
                self.stats['rows_inserted'] += 1
                return True
                
        except psycopg2.IntegrityError as e:
            # Conflit de clé unique ou autre contrainte
            if primary_key:
                self.stats['rows_skipped'] += 1
                logger.debug(f"Enregistrement existant ignoré: {table_name}.{primary_key}={row.get(primary_key)}")
            else:
                self.stats['errors'] += 1
                logger.warning(f"Erreur d'intégrité pour {table_name}: {e}")
            return False
        except psycopg2.DataError as e:
            # Erreur de type de données
            self.stats['errors'] += 1
            logger.error(f"Erreur de type de données pour {table_name}: {e}")
            logger.debug(f"Ligne problématique: {row}")
            return False
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"Erreur lors de l'insertion dans {table_name}: {e}")
            logger.debug(f"Ligne problématique: {row}")
            return False
    
    def sync_table(self, table_name: str):
        """Synchronise une table complète"""
        logger.info(f"\n{'='*60}")
        logger.info(f"Synchronisation de la table: {table_name}")
        logger.info(f"{'='*60}")
        
        if not self.table_exists(self.local_conn, table_name):
            logger.warning(f"Table {table_name} n'existe pas dans la base locale, ignorée")
            return
        
        if not self.table_exists(self.prod_conn, table_name):
            logger.warning(f"Table {table_name} n'existe pas dans la base de production, ignorée")
            return
        
        # Récupérer les données
        rows = self.get_table_data(table_name)
        if not rows:
            logger.info(f"Aucune donnée à synchroniser pour {table_name}")
            return
        
        logger.info(f"Récupération de {len(rows)} enregistrements depuis la base locale")
        
        # Récupérer la clé primaire
        primary_key = self.get_primary_key(self.prod_conn, table_name)
        
        if self.dry_run:
            logger.info(f"[DRY RUN] {len(rows)} enregistrements seraient synchronisés")
            self.stats['rows_inserted'] += len(rows)
            return
        
        # Synchroniser chaque ligne
        inserted = 0
        skipped = 0
        updated = 0
        
        for i, row in enumerate(rows, 1):
            if primary_key and not self.update_existing:
                # Vérifier si l'enregistrement existe déjà
                pk_value = row.get(primary_key)
                if pk_value and self.row_exists(table_name, primary_key, pk_value):
                    skipped += 1
                    if i % 100 == 0:
                        logger.info(f"Progression: {i}/{len(rows)} (insérés: {inserted}, ignorés: {skipped}, mis à jour: {updated})")
                    continue
            
            # Insérer ou mettre à jour
            before_inserted = self.stats['rows_inserted']
            before_updated = self.stats['rows_updated']
            
            self.insert_row(table_name, row, primary_key)
            
            if self.stats['rows_inserted'] > before_inserted:
                inserted += 1
            elif self.stats['rows_updated'] > before_updated:
                updated += 1
            else:
                skipped += 1
            
            if i % 100 == 0:
                logger.info(f"Progression: {i}/{len(rows)} (insérés: {inserted}, ignorés: {skipped}, mis à jour: {updated})")
        
        logger.info(f"✓ Table {table_name} synchronisée: {inserted} insérés, {updated} mis à jour, {skipped} ignorés")
        self.stats['tables_processed'] += 1
    
    def sync_all(self):
        """Synchronise toutes les tables dans l'ordre correct"""
        logger.info("Début de la synchronisation des données")
        logger.info(f"Mode: {'DRY RUN' if self.dry_run else 'EXECUTION'}")
        logger.info(f"Stratégie: {'UPDATE existing' if self.update_existing else 'SKIP existing'}")
        
        try:
            # Synchroniser les tables principales
            for table_name in self.TABLE_ORDER:
                self.sync_table(table_name)
            
            # Synchroniser les tables d'association
            logger.info(f"\n{'='*60}")
            logger.info("Synchronisation des tables d'association")
            logger.info(f"{'='*60}")
            
            for table_name in self.ASSOCIATION_TABLES:
                self.sync_table(table_name)
            
            # Commit des transactions
            if not self.dry_run:
                self.prod_conn.commit()
                logger.info("\n✓ Transaction commitée avec succès")
            
            # Afficher les statistiques
            self.print_stats()
            
        except Exception as e:
            logger.error(f"Erreur lors de la synchronisation: {e}")
            if not self.dry_run:
                self.prod_conn.rollback()
                logger.error("Transaction annulée (rollback)")
            raise
    
    def print_stats(self):
        """Affiche les statistiques de synchronisation"""
        logger.info(f"\n{'='*60}")
        logger.info("STATISTIQUES DE SYNCHRONISATION")
        logger.info(f"{'='*60}")
        logger.info(f"Tables traitées: {self.stats['tables_processed']}")
        logger.info(f"Lignes insérées: {self.stats['rows_inserted']}")
        logger.info(f"Lignes mises à jour: {self.stats['rows_updated']}")
        logger.info(f"Lignes ignorées: {self.stats['rows_skipped']}")
        logger.info(f"Erreurs: {self.stats['errors']}")
        logger.info(f"{'='*60}\n")


def get_database_url(env_var: str, default: Optional[str] = None) -> str:
    """Récupère l'URL de la base de données depuis les variables d'environnement"""
    url = os.getenv(env_var)
    if not url and default:
        url = default
    if not url:
        raise ValueError(f"Variable d'environnement {env_var} non définie")
    return url


def main():
    """Point d'entrée principal"""
    parser = argparse.ArgumentParser(
        description='Synchronise les données de la base locale vers la production'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Affiche ce qui serait fait sans effectuer les modifications'
    )
    parser.add_argument(
        '--update-existing',
        action='store_true',
        help='Met à jour les enregistrements existants au lieu de les ignorer'
    )
    parser.add_argument(
        '--local-db-url',
        type=str,
        help='URL de connexion à la base locale (par défaut: depuis DATABASE_URL_LOCAL ou Docker)'
    )
    parser.add_argument(
        '--prod-db-url',
        type=str,
        help='URL de connexion à la base de production (par défaut: depuis DATABASE_URL_PROD)'
    )
    
    args = parser.parse_args()
    
    # Configuration des URLs de base de données
    try:
        # Base locale (Docker par défaut)
        if args.local_db_url:
            local_db_url = args.local_db_url
        else:
            local_db_url = get_database_url(
                'DATABASE_URL_LOCAL',
                'postgresql://root:root@localhost:5432/systeme_intelligent'
            )
        
        # Base de production
        if args.prod_db_url:
            prod_db_url = args.prod_db_url
        else:
            prod_db_url = get_database_url('DATABASE_URL_PROD')
        
        logger.info(f"Base locale: {local_db_url.split('@')[1] if '@' in local_db_url else 'N/A'}")
        logger.info(f"Base production: {prod_db_url.split('@')[1] if '@' in prod_db_url else 'N/A'}")
        
    except ValueError as e:
        logger.error(f"Erreur de configuration: {e}")
        logger.error("\nOptions:")
        logger.error("  1. Définir DATABASE_URL_PROD dans votre fichier .env")
        logger.error("  2. Utiliser --prod-db-url pour spécifier l'URL directement")
        logger.error("\nExemple:")
        logger.error("  DATABASE_URL_PROD=postgresql://user:pass@host:5432/dbname")
        sys.exit(1)
    
    # Confirmation avant exécution
    if not args.dry_run:
        print("\n" + "="*60)
        print("ATTENTION: Cette opération va modifier la base de production!")
        print("="*60)
        response = input("Êtes-vous sûr de vouloir continuer? (oui/non): ")
        if response.lower() not in ['oui', 'o', 'yes', 'y']:
            logger.info("Opération annulée")
            sys.exit(0)
    
    # Créer et exécuter le synchroniseur
    syncer = DatabaseSyncer(
        local_db_url=local_db_url,
        prod_db_url=prod_db_url,
        dry_run=args.dry_run,
        update_existing=args.update_existing
    )
    
    try:
        syncer.connect()
        syncer.sync_all()
    except Exception as e:
        logger.error(f"Erreur fatale: {e}")
        sys.exit(1)
    finally:
        syncer.close()


if __name__ == '__main__':
    main()

