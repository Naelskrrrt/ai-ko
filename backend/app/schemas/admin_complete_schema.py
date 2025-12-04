"""
Schémas de validation pour l'administration complète
"""
from marshmallow import Schema, fields, validate


# ========================
# Schémas Étudiant
# ========================

class EtudiantCreateSchema(Schema):
    """Schéma pour créer un étudiant"""
    email = fields.Email(
        required=True,
        validate=validate.Length(max=255),
        error_messages={
            'required': 'Email : ce champ est obligatoire',
            'invalid': 'Email : format invalide (ex: nom@domaine.com)'
        }
    )
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100),
        error_messages={
            'required': 'Nom : ce champ est obligatoire',
            'invalid': 'Nom : doit contenir entre 2 et 100 caractères'
        }
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=8, max=128),
        error_messages={
            'required': 'Mot de passe : ce champ est obligatoire',
            'invalid': 'Mot de passe : doit contenir au moins 8 caractères'
        }
    )
    numero_etudiant = fields.Str(
        validate=validate.Length(max=50),
        data_key='numeroEtudiant',
        error_messages={
            'invalid': 'Numéro étudiant : ne peut pas dépasser 50 caractères'
        }
    )
    telephone = fields.Str(
        validate=validate.Length(max=20),
        error_messages={
            'invalid': 'Téléphone : ne peut pas dépasser 20 caractères'
        }
    )
    date_naissance = fields.Date(
        data_key='dateNaissance',
        error_messages={
            'invalid': 'Date de naissance : format invalide (attendu: YYYY-MM-DD)'
        }
    )
    niveau_ids = fields.List(
        fields.Str(),
        data_key='niveauIds',
        error_messages={
            'invalid': 'Niveaux : doit être une liste d\'identifiants valides'
        }
    )
    classe_ids = fields.List(fields.Str(), data_key='classeIds')
    matiere_ids = fields.List(fields.Str(), data_key='matiereIds')
    annee_scolaire = fields.Str(
        data_key='anneeScolaire',
        error_messages={
            'invalid': 'Année scolaire : format invalide (ex: 2024-2025)'
        }
    )


class EtudiantUpdateSchema(Schema):
    """Schéma pour mettre à jour un étudiant"""
    email = fields.Email(
        validate=validate.Length(max=255),
        error_messages={
            'invalid': 'Email : format invalide (ex: nom@domaine.com)'
        }
    )
    name = fields.Str(
        validate=validate.Length(min=2, max=100),
        error_messages={
            'invalid': 'Nom : doit contenir entre 2 et 100 caractères'
        }
    )
    password = fields.Str(
        validate=validate.Length(min=8, max=128),
        error_messages={
            'invalid': 'Mot de passe : doit contenir au moins 8 caractères'
        }
    )
    numero_etudiant = fields.Str(
        validate=validate.Length(max=50),
        data_key='numeroEtudiant',
        error_messages={
            'invalid': 'Numéro étudiant : ne peut pas dépasser 50 caractères'
        }
    )
    telephone = fields.Str(
        validate=validate.Length(max=20),
        error_messages={
            'invalid': 'Téléphone : ne peut pas dépasser 20 caractères'
        }
    )
    date_naissance = fields.Date(
        data_key='dateNaissance',
        error_messages={
            'invalid': 'Date de naissance : format invalide (attendu: YYYY-MM-DD)'
        }
    )
    email_verified = fields.Bool(data_key='emailVerified')


class EtudiantAssignSchema(Schema):
    """Schéma pour assigner des niveaux/classes/matières à un étudiant"""
    niveau_ids = fields.List(fields.Str(), data_key='niveauIds')
    classe_ids = fields.List(fields.Str(), data_key='classeIds')
    matiere_ids = fields.List(fields.Str(), data_key='matiereIds')
    annee_scolaire = fields.Str(
        required=True,
        data_key='anneeScolaire',
        error_messages={
            'required': 'Année scolaire : ce champ est obligatoire (ex: 2024-2025)'
        }
    )


# ========================
# Schémas Professeur
# ========================

class ProfesseurCreateSchema(Schema):
    """Schéma pour créer un professeur"""
    email = fields.Email(
        required=True,
        validate=validate.Length(max=255),
        error_messages={
            'required': 'Email : ce champ est obligatoire',
            'invalid': 'Email : format invalide (ex: nom@domaine.com)'
        }
    )
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100),
        error_messages={
            'required': 'Nom : ce champ est obligatoire',
            'invalid': 'Nom : doit contenir entre 2 et 100 caractères'
        }
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=8, max=128),
        error_messages={
            'required': 'Mot de passe : ce champ est obligatoire',
            'invalid': 'Mot de passe : doit contenir au moins 8 caractères'
        }
    )
    numero_enseignant = fields.Str(
        validate=validate.Length(max=50),
        data_key='numeroEnseignant',
        error_messages={
            'invalid': 'Numéro enseignant : ne peut pas dépasser 50 caractères'
        }
    )
    telephone = fields.Str(
        validate=validate.Length(max=20),
        error_messages={
            'invalid': 'Téléphone : ne peut pas dépasser 20 caractères'
        }
    )
    matiere_ids = fields.List(
        fields.Str(),
        data_key='matiereIds',
        error_messages={
            'invalid': 'Matières : doit être une liste d\'identifiants valides'
        }
    )
    niveau_ids = fields.List(
        fields.Str(),
        data_key='niveauIds',
        error_messages={
            'invalid': 'Niveaux : doit être une liste d\'identifiants valides'
        }
    )
    classe_ids = fields.List(fields.Str(), data_key='classeIds')
    annee_scolaire = fields.Str(
        data_key='anneeScolaire',
        error_messages={
            'invalid': 'Année scolaire : format invalide (ex: 2024-2025)'
        }
    )


class ProfesseurUpdateSchema(Schema):
    """Schéma pour mettre à jour un professeur"""
    email = fields.Email(
        validate=validate.Length(max=255),
        error_messages={
            'invalid': 'Email : format invalide (ex: nom@domaine.com)'
        }
    )
    name = fields.Str(
        validate=validate.Length(min=2, max=100),
        error_messages={
            'invalid': 'Nom : doit contenir entre 2 et 100 caractères'
        }
    )
    password = fields.Str(
        validate=validate.Length(min=8, max=128),
        error_messages={
            'invalid': 'Mot de passe : doit contenir au moins 8 caractères'
        }
    )
    numero_enseignant = fields.Str(
        validate=validate.Length(max=50),
        data_key='numeroEnseignant',
        error_messages={
            'invalid': 'Numéro enseignant : ne peut pas dépasser 50 caractères'
        }
    )
    telephone = fields.Str(
        validate=validate.Length(max=20),
        error_messages={
            'invalid': 'Téléphone : ne peut pas dépasser 20 caractères'
        }
    )
    email_verified = fields.Bool(data_key='emailVerified')


class ProfesseurAssignSchema(Schema):
    """Schéma pour assigner des matières/niveaux/classes à un professeur"""
    matiere_ids = fields.List(fields.Str(), data_key='matiereIds')
    niveau_ids = fields.List(fields.Str(), data_key='niveauIds')
    classe_ids = fields.List(fields.Str(), data_key='classeIds')
    annee_scolaire = fields.Str(
        data_key='anneeScolaire',
        error_messages={
            'invalid': 'Année scolaire : format invalide (ex: 2024-2025)'
        }
    )


# ========================
# Schémas Matière (affectation)
# ========================

class MatiereAssignProfesseursSchema(Schema):
    """Schéma pour affecter des professeurs à une matière"""
    professeur_ids = fields.List(
        fields.Str(), required=True, data_key='professeurIds')
    annee_scolaire = fields.Str(data_key='anneeScolaire')


# ========================
# Schémas Configuration IA
# ========================

class AIModelConfigCreateSchema(Schema):
    """Schéma pour créer une configuration de modèle IA"""
    nom = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    provider = fields.Str(required=True, validate=validate.OneOf(
        ['huggingface', 'openai', 'anthropic', 'local']))
    model_id = fields.Str(required=True, validate=validate.Length(
        max=255), data_key='modelId')
    description = fields.Str()
    api_url = fields.Str(validate=validate.Length(max=500), data_key='apiUrl')
    max_tokens = fields.Int(validate=validate.Range(
        min=100, max=16384), data_key='maxTokens')
    temperature = fields.Float(validate=validate.Range(min=0.0, max=2.0))
    top_p = fields.Float(validate=validate.Range(
        min=0.0, max=1.0), data_key='topP')
    timeout_seconds = fields.Int(validate=validate.Range(
        min=10, max=300), data_key='timeoutSeconds')
    actif = fields.Bool()
    est_defaut = fields.Bool(data_key='estDefaut')
    ordre_priorite = fields.Int(data_key='ordrePriorite')


class AIModelConfigUpdateSchema(Schema):
    """Schéma pour mettre à jour une configuration de modèle IA"""
    nom = fields.Str(validate=validate.Length(min=2, max=100))
    provider = fields.Str(validate=validate.OneOf(
        ['huggingface', 'openai', 'anthropic', 'local']))
    model_id = fields.Str(validate=validate.Length(
        max=255), data_key='modelId')
    description = fields.Str()
    api_url = fields.Str(validate=validate.Length(max=500), data_key='apiUrl')
    max_tokens = fields.Int(validate=validate.Range(
        min=100, max=16384), data_key='maxTokens')
    temperature = fields.Float(validate=validate.Range(min=0.0, max=2.0))
    top_p = fields.Float(validate=validate.Range(
        min=0.0, max=1.0), data_key='topP')
    timeout_seconds = fields.Int(validate=validate.Range(
        min=10, max=300), data_key='timeoutSeconds')
    actif = fields.Bool()
    est_defaut = fields.Bool(data_key='estDefaut')
    ordre_priorite = fields.Int(data_key='ordrePriorite')


# ========================
# Schémas Session Examen (admin)
# ========================

class SessionExamenAdminCreateSchema(Schema):
    """Schéma admin pour créer une session d'examen"""
    titre = fields.Str(required=True, validate=validate.Length(min=3, max=255))
    description = fields.Str()
    date_debut = fields.DateTime(required=True, data_key='dateDebut')
    date_fin = fields.DateTime(required=True, data_key='dateFin')
    duree_minutes = fields.Int(required=True, validate=validate.Range(
        min=1, max=480), data_key='dureeMinutes')
    tentatives_max = fields.Int(validate=validate.Range(
        min=1, max=10), data_key='tentativesMax')
    melange_questions = fields.Bool(data_key='melangeQuestions')
    melange_options = fields.Bool(data_key='melangeOptions')
    afficher_correction = fields.Bool(data_key='afficherCorrection')
    note_passage = fields.Float(validate=validate.Range(
        min=0, max=20), data_key='notePassage')
    status = fields.Str(validate=validate.OneOf(
        ['programmee', 'en_cours', 'terminee', 'annulee']))
    qcm_id = fields.Str(required=True, data_key='qcmId')
    classe_id = fields.Str(data_key='classeId')
    # Admin peut spécifier le créateur
    createur_id = fields.Str(data_key='createurId')


# ========================
# Réponses
# ========================

class EtudiantResponseSchema(Schema):
    """Schéma de réponse pour un étudiant"""
    id = fields.Str()
    email = fields.Email()
    name = fields.Str()
    role = fields.Str()
    avatar = fields.Str(allow_none=True)
    emailVerified = fields.Bool()
    numeroEtudiant = fields.Str(allow_none=True)
    telephone = fields.Str(allow_none=True)
    dateNaissance = fields.Str(allow_none=True)
    niveaux = fields.List(fields.Dict())
    classes = fields.List(fields.Dict())
    matieres = fields.List(fields.Dict())
    createdAt = fields.Str()
    updatedAt = fields.Str()


class ProfesseurResponseSchema(Schema):
    """Schéma de réponse pour un professeur"""
    id = fields.Str()
    email = fields.Email()
    name = fields.Str()
    role = fields.Str()
    avatar = fields.Str(allow_none=True)
    emailVerified = fields.Bool()
    numeroEnseignant = fields.Str(allow_none=True)
    telephone = fields.Str(allow_none=True)
    matieresEnseignees = fields.List(fields.Dict())
    niveauxEnseignes = fields.List(fields.Dict())
    classesEnseignees = fields.List(fields.Dict())
    createdAt = fields.Str()
    updatedAt = fields.Str()
