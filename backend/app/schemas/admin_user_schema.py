"""
Schémas de validation pour l'administration des utilisateurs
"""
from marshmallow import Schema, fields, validate
from app.models.user import UserRole


class UserCreateSchema(Schema):
    """Schéma de validation pour la création d'un utilisateur par l'admin"""
    email = fields.Email(
        required=True,
        validate=validate.Length(max=255),
        error_messages={'required': 'L\'email est requis', 'invalid': 'Format d\'email invalide'}
    )
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100),
        error_messages={'required': 'Le nom est requis', 'invalid': 'Le nom doit contenir entre 2 et 100 caractères'}
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=8, max=128),
        error_messages={'required': 'Le mot de passe est requis', 'invalid': 'Le mot de passe doit contenir au moins 8 caractères'}
    )
    role = fields.Str(
        required=True,
        validate=validate.OneOf([r.value for r in UserRole]),
        error_messages={'required': 'Le rôle est requis', 'invalid': 'Rôle invalide. Rôles autorisés: admin, enseignant, etudiant'}
    )
    email_verified = fields.Bool(
        required=False,
        missing=False,
        error_messages={'invalid': 'email_verified doit être un booléen'},
        data_key='emailVerified',  # Accepter emailVerified (camelCase) depuis le frontend
        allow_none=False
    )


class UserUpdateSchema(Schema):
    """Schéma de validation pour la mise à jour d'un utilisateur"""
    email = fields.Email(
        required=False,
        validate=validate.Length(max=255),
        error_messages={'invalid': 'Format d\'email invalide'}
    )
    name = fields.Str(
        required=False,
        validate=validate.Length(min=2, max=100),
        error_messages={'invalid': 'Le nom doit contenir entre 2 et 100 caractères'}
    )
    password = fields.Str(
        required=False,
        validate=validate.Length(min=8, max=128),
        error_messages={'invalid': 'Le mot de passe doit contenir au moins 8 caractères'}
    )
    email_verified = fields.Bool(
        required=False,
        error_messages={'invalid': 'email_verified doit être un booléen'},
        data_key='emailVerified',  # Accepter emailVerified (camelCase) depuis le frontend
        allow_none=False
    )


class ChangeRoleSchema(Schema):
    """Schéma de validation pour le changement de rôle"""
    role = fields.Str(
        required=True,
        validate=validate.OneOf([r.value for r in UserRole]),
        error_messages={'required': 'Le rôle est requis', 'invalid': 'Rôle invalide. Rôles autorisés: admin, enseignant, etudiant'}
    )


class UserResponseSchema(Schema):
    """Schéma de sérialisation pour les réponses utilisateur"""
    id = fields.Str()
    email = fields.Email()
    name = fields.Str()
    role = fields.Str()
    avatar = fields.Str(allow_none=True)
    emailVerified = fields.Bool()
    createdAt = fields.Str()
    updatedAt = fields.Str()



