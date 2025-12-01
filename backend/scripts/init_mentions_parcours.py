"""
Script d'initialisation des Mentions et Parcours

Ce script supprime toutes les mentions et parcours existants et crée
les nouvelles mentions et parcours selon la structure définie.

Usage:
    python init_mentions_parcours.py
"""
import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError, ProgrammingError
from sqlalchemy import text

# Ajouter le chemin du répertoire parent pour l'importation des modules de l'application
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app, db
from app.models.mention import Mention
from app.models.parcours import Parcours
from app.models.etablissement import Etablissement

# Charger les variables d'environnement
load_dotenv()

# Configuration de l'application Flask
app = create_app()
app.app_context().push()

# Structure des mentions et parcours
MENTIONS_DATA = [
    {
        "code": "INFO",
        "nom": "Informatique",
        "description": "Mention en Informatique",
        "couleur": "#3B82F6",
        "icone": "code",
        "parcours": [
            {
                "code": "GLBD",
                "nom": "Génie Logiciel et base de Données",
                "description": "Parcours spécialisé en génie logiciel et bases de données",
            },
            {
                "code": "ASR",
                "nom": "Administration des Système et réseaux",
                "description": "Parcours spécialisé en administration des systèmes et réseaux",
            },
            {
                "code": "INFO_GEN",
                "nom": "Informatique Générale",
                "description": "Parcours général en informatique",
            },
        ],
    },
    {
        "code": "IA",
        "nom": "Intelligence Artificiel",
        "description": "Mention en Intelligence Artificielle",
        "couleur": "#8B5CF6",
        "icone": "brain",
        "parcours": [
            {
                "code": "GID",
                "nom": "Gouvernance et Ingénierie de Données (GID)",
                "description": "Parcours spécialisé en gouvernance et ingénierie de données",
            },
            {
                "code": "OCC",
                "nom": "Objets connectés et Cybersécurité (OCC)",
                "description": "Parcours spécialisé en objets connectés et cybersécurité",
            },
        ],
    },
]


def get_or_create_default_etablissement():
    """Récupère ou crée un établissement par défaut"""
    etablissement = Etablissement.query.first()

    if not etablissement:
        print("\n[INFO] Aucun établissement trouvé, création d'un établissement par défaut...")
        etablissement = Etablissement(
            code="DEFAULT",
            nom="Établissement par défaut",
            nom_court="Défaut",
            description="Établissement créé automatiquement",
            type_etablissement="université",
            pays="Madagascar",
            actif=True,
        )
        db.session.add(etablissement)
        db.session.commit()
        print(f"[OK] Établissement par défaut créé: {etablissement.code} - {etablissement.nom}")
    else:
        print(f"[OK] Établissement trouvé: {etablissement.code} - {etablissement.nom}")

    return etablissement


def delete_all_mentions_and_parcours():
    """Supprime toutes les mentions et parcours existants"""
    print("\n[INFO] Suppression des mentions et parcours existants...")

    # Compter avant suppression
    mentions_count = Mention.query.count()
    parcours_count = Parcours.query.count()

    print(f"[INFO] {mentions_count} mention(s) et {parcours_count} parcours trouvés")

    # 1. Supprimer les associations dans les tables de liaison
    tables_to_clear = [
        'enseignant_mentions',
        'enseignant_parcours',
    ]

    for table in tables_to_clear:
        try:
            print(f"  - Suppression des associations {table}...")
            db.session.execute(db.text(f"DELETE FROM {table}"))
            db.session.flush()
            print(f"  [OK] Associations {table} supprimées")
        except Exception as e:
            print(f"  [WARN] Table {table} non trouvée ou erreur: {e}")

    # 2. Mettre à NULL les références dans la table etudiants
    try:
        from app.models.etudiant import Etudiant
        etudiants_updated = db.session.query(Etudiant).filter(
            (Etudiant.mention_id.isnot(None)) | (Etudiant.parcours_id.isnot(None))
        ).update({
            'mention_id': None,
            'parcours_id': None
        }, synchronize_session=False)
        db.session.flush()
        if etudiants_updated > 0:
            print(f"  [OK] {etudiants_updated} étudiant(s) mis à jour (mention/parcours mis à NULL)")
    except Exception as e:
        print(f"  [WARN] Erreur lors de la mise à jour des étudiants: {e}")

    # 3. Supprimer tous les parcours
    try:
        Parcours.query.delete()
        db.session.flush()
        print(f"[OK] {parcours_count} parcours supprimés")
    except Exception as e:
        db.session.rollback()
        print(f"[ERREUR] Erreur lors de la suppression des parcours: {e}")
        raise

    # 4. Supprimer toutes les mentions (les parcours associés sont déjà supprimés)
    try:
        Mention.query.delete()
        db.session.commit()
        print(f"[OK] {mentions_count} mention(s) supprimée(s)")
    except Exception as e:
        db.session.rollback()
        print(f"[ERREUR] Erreur lors de la suppression des mentions: {e}")
        raise


def create_mentions_and_parcours(etablissement_id: str):
    """Crée les mentions et leurs parcours"""
    print("\n[INFO] Création des mentions et parcours...")
    created_mentions = 0
    created_parcours = 0

    for mention_data in MENTIONS_DATA:
        # Créer la mention
        mention = Mention(
            code=mention_data["code"],
            nom=mention_data["nom"],
            description=mention_data.get("description"),
            etablissement_id=etablissement_id,
            couleur=mention_data.get("couleur"),
            icone=mention_data.get("icone"),
            actif=True,
        )
        db.session.add(mention)
        db.session.flush()  # Pour obtenir l'ID de la mention

        created_mentions += 1
        print(f"\n[OK] Mention créée: {mention.code} - {mention.nom}")

        # Créer les parcours de cette mention
        for parcours_data in mention_data.get("parcours", []):
            parcours = Parcours(
                code=parcours_data["code"],
                nom=parcours_data["nom"],
                description=parcours_data.get("description"),
                mention_id=mention.id,
                duree_annees=3,  # Durée par défaut de 3 ans
                actif=True,
            )
            db.session.add(parcours)
            created_parcours += 1
            print(f"  ➣ Parcours créé: {parcours.code} - {parcours.nom}")

    try:
        db.session.commit()
        print(f"\n[OK] {created_mentions} mention(s) et {created_parcours} parcours créés avec succès!")
    except IntegrityError as e:
        db.session.rollback()
        print(f"[ERREUR] Erreur d'intégrité lors de la création: {e}")
    except Exception as e:
        db.session.rollback()
        print(f"[ERREUR] Erreur inattendue: {e}")


def list_all_mentions_and_parcours():
    """Affiche toutes les mentions et leurs parcours"""
    mentions = Mention.query.all()
    print("\n" + "=" * 80)
    print("LISTE DES MENTIONS ET PARCOURS")
    print("=" * 80)

    for mention in mentions:
        print(f"\n{mention.code} - {mention.nom}")
        if mention.description:
            print(f"  Description: {mention.description}")
        parcours_list = Parcours.query.filter_by(mention_id=mention.id).all()
        if parcours_list:
            print(f"  Parcours ({len(parcours_list)}):")
            for parcours in parcours_list:
                print(f"    ➣ {parcours.code} - {parcours.nom}")
        else:
            print("  Aucun parcours")

    print("\n" + "=" * 80)
    print(f"Total: {len(mentions)} mention(s)")


def main():
    print("=" * 80)
    print("INITIALISATION DES MENTIONS ET PARCOURS")
    print("=" * 80)

    # Récupérer ou créer un établissement par défaut
    etablissement = get_or_create_default_etablissement()

    # Supprimer toutes les mentions et parcours existants
    delete_all_mentions_and_parcours()

    # Créer les nouvelles mentions et parcours
    create_mentions_and_parcours(etablissement.id)

    # Afficher la liste
    list_all_mentions_and_parcours()

    print("\n[OK] Script terminé avec succès!")
    print("=" * 80)


if __name__ == "__main__":
    main()

