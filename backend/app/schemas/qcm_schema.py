"""
Schémas de validation pour les QCM
"""
from marshmallow import Schema, fields, validate


class QCMCreateSchema(Schema):
    """Schéma de validation pour la création d'un QCM"""
    titre = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=255),
        error_messages={'required': 'Le titre est requis', 'invalid': 'Le titre doit contenir entre 3 et 255 caractères'}
    )
    description = fields.Str(
        required=False,
        validate=validate.Length(max=5000),
        allow_none=True,
        error_messages={'invalid': 'La description ne peut pas dépasser 5000 caractères'}
    )
    duree = fields.Int(
        required=False,
        validate=validate.Range(min=1, max=999),
        allow_none=True,
        error_messages={'invalid': 'La durée doit être entre 1 et 999 minutes'}
    )
    matiere = fields.Str(
        required=False,
        validate=validate.Length(max=100),
        allow_none=True,
        error_messages={'invalid': 'La matière ne peut pas dépasser 100 caractères'}
    )
    status = fields.Str(
        required=False,
        validate=validate.OneOf(['draft', 'published', 'archived']),
        missing='draft',
        error_messages={'invalid': 'Status invalide. Status autorisés: draft, published, archived'}
    )


class QCMUpdateSchema(Schema):
    """Schéma de validation pour la mise à jour d'un QCM"""
    titre = fields.Str(
        required=False,
        validate=validate.Length(min=3, max=255),
        error_messages={'invalid': 'Le titre doit contenir entre 3 et 255 caractères'}
    )
    description = fields.Str(
        required=False,
        validate=validate.Length(max=5000),
        allow_none=True,
        error_messages={'invalid': 'La description ne peut pas dépasser 5000 caractères'}
    )
    duree = fields.Int(
        required=False,
        validate=validate.Range(min=1, max=999),
        allow_none=True,
        error_messages={'invalid': 'La durée doit être entre 1 et 999 minutes'}
    )
    matiere = fields.Str(
        required=False,
        validate=validate.Length(max=100),
        allow_none=True,
        error_messages={'invalid': 'La matière ne peut pas dépasser 100 caractères'}
    )
    status = fields.Str(
        required=False,
        validate=validate.OneOf(['draft', 'published', 'archived']),
        error_messages={'invalid': 'Status invalide. Status autorisés: draft, published, archived'}
    )


class QCMResponseSchema(Schema):
    """Schéma de sérialisation pour les réponses QCM"""
    id = fields.Str()
    titre = fields.Str()
    description = fields.Str(allow_none=True)
    duree = fields.Int(allow_none=True)
    matiere = fields.Str(allow_none=True)
    status = fields.Str()
    createurId = fields.Str()
    createur = fields.Dict(allow_none=True)
    nombreQuestions = fields.Int()
    createdAt = fields.Str()
    updatedAt = fields.Str()
