"""
Schémas de validation pour les utilisateurs
"""
from marshmallow import Schema, fields, validate, ValidationError, INCLUDE
from app.models.user import UserRole


class UserRegisterSchema(Schema):
    """Schéma de validation pour l'inscription"""
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=255),
        error_messages={'required': 'Le nom est requis', 'invalid': 'Le nom doit contenir entre 2 et 255 caractères'}
    )
    email = fields.Email(
        required=True,
        validate=validate.Length(max=255),
        error_messages={'required': 'L\'email est requis', 'invalid': 'Format d\'email invalide'}
    )
    password = fields.Str(
        required=True,
        validate=validate.Length(min=8, max=128),
        error_messages={'required': 'Le mot de passe est requis', 'invalid': 'Le mot de passe doit contenir au moins 8 caractères'}
    )
    role = fields.Str(
        required=False,
        validate=validate.OneOf([r.value for r in UserRole]),
        error_messages={'invalid': 'Rôle invalide. Rôles autorisés: admin, enseignant, etudiant'}
    )


class UserLoginSchema(Schema):
    """Schéma de validation pour la connexion"""
    email = fields.Email(
        required=True,
        error_messages={'required': 'L\'email est requis', 'invalid': 'Format d\'email invalide'}
    )
    password = fields.Str(
        required=True,
        error_messages={'required': 'Le mot de passe est requis'}
    )


class UserResponseSchema(Schema):
    """Schéma de sérialisation pour les réponses utilisateur"""
    id = fields.Str()
    email = fields.Email()
    name = fields.Str()
    role = fields.Str()
    avatar = fields.Str(allow_none=True)
    emailVerified = fields.Bool()
    createdAt = fields.Str()  # Accepter string (déjà formaté par to_dict)
    updatedAt = fields.Str()  # Accepter string (déjà formaté par to_dict)
    # Profils liés (optionnels)
    etudiantProfil = fields.Dict(allow_none=True)
    enseignantProfil = fields.Dict(allow_none=True)
    
    class Meta:
        # Permettre les champs non déclarés (pour flexibilité)
        unknown = INCLUDE

