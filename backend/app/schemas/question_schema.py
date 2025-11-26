"""
Schémas de validation pour les Questions
"""
from marshmallow import Schema, fields, validate


class QuestionOptionSchema(Schema):
    """Schéma pour une option de question QCM"""
    id = fields.Str(required=True)
    texte = fields.Str(required=True, validate=validate.Length(min=1, max=500))
    estCorrecte = fields.Bool(required=True)


class QuestionCreateSchema(Schema):
    """Schéma de validation pour la création d'une question"""
    enonce = fields.Str(
        required=True,
        validate=validate.Length(min=5, max=5000),
        error_messages={'required': 'L\'énoncé est requis', 'invalid': 'L\'énoncé doit contenir entre 5 et 5000 caractères'}
    )
    type_question = fields.Str(
        required=True,
        validate=validate.OneOf(['qcm', 'vrai_faux', 'texte_libre']),
        error_messages={'required': 'Le type de question est requis', 'invalid': 'Type de question invalide'}
    )
    options = fields.List(
        fields.Nested(QuestionOptionSchema),
        required=False,
        allow_none=True
    )
    reponse_correcte = fields.Str(
        required=False,
        allow_none=True
    )
    points = fields.Int(
        required=False,
        validate=validate.Range(min=1, max=100),
        missing=1,
        error_messages={'invalid': 'Les points doivent être entre 1 et 100'}
    )
    explication = fields.Str(
        required=False,
        validate=validate.Length(max=1000),
        allow_none=True,
        error_messages={'invalid': 'L\'explication ne peut pas dépasser 1000 caractères'}
    )
    qcm_id = fields.Str(
        required=True,
        error_messages={'required': 'Le QCM est requis'}
    )


class QuestionUpdateSchema(Schema):
    """Schéma de validation pour la mise à jour d'une question"""
    enonce = fields.Str(
        required=False,
        validate=validate.Length(min=5, max=5000),
        error_messages={'invalid': 'L\'énoncé doit contenir entre 5 et 5000 caractères'}
    )
    options = fields.List(
        fields.Nested(QuestionOptionSchema),
        required=False,
        allow_none=True
    )
    reponse_correcte = fields.Str(
        required=False,
        allow_none=True
    )
    points = fields.Int(
        required=False,
        validate=validate.Range(min=1, max=100),
        error_messages={'invalid': 'Les points doivent être entre 1 et 100'}
    )
    explication = fields.Str(
        required=False,
        validate=validate.Length(max=1000),
        allow_none=True,
        error_messages={'invalid': 'L\'explication ne peut pas dépasser 1000 caractères'}
    )


class QuestionResponseSchema(Schema):
    """Schéma de sérialisation pour les réponses Question"""
    id = fields.Str()
    enonce = fields.Str()
    typeQuestion = fields.Str()
    options = fields.List(fields.Dict(), allow_none=True)
    reponseCorrecte = fields.Str(allow_none=True)
    points = fields.Int()
    explication = fields.Str(allow_none=True)
    qcmId = fields.Str()
    qcm = fields.Dict(allow_none=True)
    createdAt = fields.Str()
    updatedAt = fields.Str()
