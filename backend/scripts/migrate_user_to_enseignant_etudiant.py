"""
Script de migration des données User vers Enseignant/Etudiant

Ce script migre les utilisateurs existants avec numero_enseignant ou numero_etudiant
vers les nouveaux modèles Enseignant et Etudiant.

Usage:
    python migrate_user_to_enseignant_etudiant.py
"""
import sys
import os
from pathlib import Path

# Ajouter le répertoire backend au PYTHONPATH
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app import create_app, db
from app.models.user import User, UserRole
from app.models.enseignant import Enseignant
from app.models.etudiant import Etudiant
from app.models.etablissement import Etablissement
import uuid
import logging

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_default_etablissement():
    """Crée un établissement par défaut si aucun n'existe"""
    etablissement = db.session.query(Etablissement).first()
    
    if not etablissement:
        logger.info("Création de l'établissement par défaut...")
        etablissement = Etablissement(
            code='DEFAULT',
            nom='Établissement par défaut',
            nom_court='Défaut',
            description='Établissement créé automatiquement lors de la migration',
            type_etablissement='université',
            pays='Madagascar',
            actif=True
        )
        db.session.add(etablissement)
        db.session.commit()
        logger.info(f"✓ Établissement par défaut créé: {etablissement.id}")
    else:
        logger.info(f"✓ Établissement existant trouvé: {etablissement.nom}")
    
    return etablissement


def migrate_enseignants(etablissement):
    """Migre les utilisateurs avec numero_enseignant vers Enseignant"""
    logger.info("\n=== Migration des Enseignants ===")
    
    # Trouver tous les users avec role ENSEIGNANT
    users_enseignants = db.session.query(User).filter(
        User.role.in_([UserRole.ENSEIGNANT, UserRole.PROFESSEUR])
    ).all()
    
    logger.info(f"Trouvé {len(users_enseignants)} utilisateurs enseignants")
    
    migrated_count = 0
    skipped_count = 0
    error_count = 0
    
    for user in users_enseignants:
        try:
            # Vérifier si l'enseignant existe déjà
            existing = db.session.query(Enseignant).filter_by(user_id=user.id).first()
            if existing:
                logger.info(f"  ⊘ Enseignant déjà migré: {user.email}")
                skipped_count += 1
                continue
            
            # Déterminer le numéro d'enseignant
            if hasattr(user, 'numero_enseignant') and user.numero_enseignant:
                numero = user.numero_enseignant
            else:
                # Générer un numéro unique si manquant
                numero = f"ENS{user.id[:8].upper()}"
                logger.warning(f"  ! Numéro d'enseignant manquant pour {user.email}, généré: {numero}")
            
            # Créer l'enseignant
            enseignant = Enseignant(
                user_id=user.id,
                numero_enseignant=numero,
                etablissement_id=etablissement.id,
                actif=True
            )
            
            db.session.add(enseignant)
            
            # Migrer les relations M2M si elles existent (anciennes tables)
            # NOTE: Cette partie sera à adapter selon votre structure existante
            if hasattr(user, 'matieres_enseignees'):
                for matiere in user.matieres_enseignees:
                    enseignant.matieres.append(matiere)
            
            if hasattr(user, 'niveaux_enseignes'):
                for niveau in user.niveaux_enseignes:
                    enseignant.niveaux.append(niveau)
            
            db.session.commit()
            migrated_count += 1
            logger.info(f"  ✓ Migré: {user.email} -> {numero}")
            
        except Exception as e:
            db.session.rollback()
            error_count += 1
            logger.error(f"  ✗ Erreur pour {user.email}: {str(e)}")
    
    logger.info(f"\nRésumé Enseignants:")
    logger.info(f"  - Migrés: {migrated_count}")
    logger.info(f"  - Déjà existants: {skipped_count}")
    logger.info(f"  - Erreurs: {error_count}")
    
    return migrated_count, skipped_count, error_count


def migrate_etudiants(etablissement):
    """Migre les utilisateurs avec numero_etudiant vers Etudiant"""
    logger.info("\n=== Migration des Étudiants ===")
    
    # Trouver tous les users avec role ETUDIANT
    users_etudiants = db.session.query(User).filter_by(role=UserRole.ETUDIANT).all()
    
    logger.info(f"Trouvé {len(users_etudiants)} utilisateurs étudiants")
    
    migrated_count = 0
    skipped_count = 0
    error_count = 0
    
    for user in users_etudiants:
        try:
            # Vérifier si l'étudiant existe déjà
            existing = db.session.query(Etudiant).filter_by(user_id=user.id).first()
            if existing:
                logger.info(f"  ⊘ Étudiant déjà migré: {user.email}")
                skipped_count += 1
                continue
            
            # Déterminer le numéro d'étudiant
            if hasattr(user, 'numero_etudiant') and user.numero_etudiant:
                numero = user.numero_etudiant
            else:
                # Générer un numéro unique si manquant
                numero = f"ETU{user.id[:8].upper()}"
                logger.warning(f"  ! Numéro d'étudiant manquant pour {user.email}, généré: {numero}")
            
            # Créer l'étudiant
            etudiant = Etudiant(
                user_id=user.id,
                numero_etudiant=numero,
                etablissement_id=etablissement.id,
                actif=True
            )
            
            db.session.add(etudiant)
            
            # Migrer les relations M2M si elles existent (anciennes tables)
            if hasattr(user, 'matieres_etudiees'):
                for matiere in user.matieres_etudiees:
                    etudiant.matieres.append(matiere)
            
            if hasattr(user, 'classes_etudiants'):
                for classe in user.classes_etudiants:
                    etudiant.classes.append(classe)
            
            # Migrer le niveau si disponible
            if hasattr(user, 'niveaux_etudiants'):
                niveaux = list(user.niveaux_etudiants)
                if niveaux:
                    # Prendre le premier niveau (ou le plus récent si disponible)
                    etudiant.niveau_id = niveaux[0].id
            
            db.session.commit()
            migrated_count += 1
            logger.info(f"  ✓ Migré: {user.email} -> {numero}")
            
        except Exception as e:
            db.session.rollback()
            error_count += 1
            logger.error(f"  ✗ Erreur pour {user.email}: {str(e)}")
    
    logger.info(f"\nRésumé Étudiants:")
    logger.info(f"  - Migrés: {migrated_count}")
    logger.info(f"  - Déjà existants: {skipped_count}")
    logger.info(f"  - Erreurs: {error_count}")
    
    return migrated_count, skipped_count, error_count


def validate_migration():
    """Valide la cohérence des données après migration"""
    logger.info("\n=== Validation de la Migration ===")
    
    # Compter les utilisateurs
    total_users = db.session.query(User).count()
    enseignants_users = db.session.query(User).filter(
        User.role.in_([UserRole.ENSEIGNANT, UserRole.PROFESSEUR])
    ).count()
    etudiants_users = db.session.query(User).filter_by(role=UserRole.ETUDIANT).count()
    
    # Compter les profils
    total_enseignants = db.session.query(Enseignant).count()
    total_etudiants = db.session.query(Etudiant).count()
    
    logger.info(f"Utilisateurs totaux: {total_users}")
    logger.info(f"  - Enseignants (User): {enseignants_users}")
    logger.info(f"  - Étudiants (User): {etudiants_users}")
    logger.info(f"  - Profils Enseignant: {total_enseignants}")
    logger.info(f"  - Profils Étudiant: {total_etudiants}")
    
    # Vérifier la cohérence
    issues = []
    if total_enseignants < enseignants_users:
        diff = enseignants_users - total_enseignants
        issues.append(f"⚠ {diff} enseignants sans profil")
    
    if total_etudiants < etudiants_users:
        diff = etudiants_users - total_etudiants
        issues.append(f"⚠ {diff} étudiants sans profil")
    
    if issues:
        logger.warning("\nProblèmes détectés:")
        for issue in issues:
            logger.warning(f"  {issue}")
    else:
        logger.info("\n✓ Validation réussie: Tous les utilisateurs ont un profil correspondant")
    
    return len(issues) == 0


def main():
    """Fonction principale"""
    logger.info("="*60)
    logger.info("MIGRATION DES DONNÉES USER → ENSEIGNANT/ETUDIANT")
    logger.info("="*60)
    
    # Créer l'application
    app = create_app()
    
    with app.app_context():
        try:
            # 1. Créer l'établissement par défaut
            etablissement = create_default_etablissement()
            
            # 2. Migrer les enseignants
            ens_migrated, ens_skipped, ens_errors = migrate_enseignants(etablissement)
            
            # 3. Migrer les étudiants
            etu_migrated, etu_skipped, etu_errors = migrate_etudiants(etablissement)
            
            # 4. Valider la migration
            validation_ok = validate_migration()
            
            # 5. Résumé final
            logger.info("\n" + "="*60)
            logger.info("RÉSUMÉ FINAL")
            logger.info("="*60)
            logger.info(f"Enseignants migrés: {ens_migrated}")
            logger.info(f"Étudiants migrés: {etu_migrated}")
            logger.info(f"Total migrés: {ens_migrated + etu_migrated}")
            logger.info(f"Total erreurs: {ens_errors + etu_errors}")
            logger.info(f"Validation: {'✓ OK' if validation_ok else '✗ Problèmes détectés'}")
            logger.info("="*60)
            
            if ens_errors + etu_errors > 0:
                logger.warning("\n⚠ La migration s'est terminée avec des erreurs.")
                logger.warning("Consultez les logs ci-dessus pour plus de détails.")
                return 1
            
            logger.info("\n✓ Migration terminée avec succès!")
            return 0
            
        except Exception as e:
            logger.error(f"\n✗ Erreur fatale: {str(e)}", exc_info=True)
            return 1


if __name__ == '__main__':
    sys.exit(main())

