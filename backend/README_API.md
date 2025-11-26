# Documentation API Backend AI-KO

## Accès Rapide

- **Swagger UI (Documentation Interactive)** : http://localhost:5000/api/docs/swagger/
- **Documentation Markdown** : Voir `API_DOCUMENTATION.md`

## Installation

La documentation API utilise Flask-RESTX pour générer automatiquement la documentation Swagger/OpenAPI.

### Dépendances

```bash
pip install flask-restx
```

Ou via requirements.txt (déjà ajouté) :

```
flask-restx==1.3.0
```

## Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── docs.py          # Configuration Swagger/OpenAPI
│   │   ├── auth.py          # Endpoints d'authentification
│   │   └── health.py        # Endpoints de health check
│   └── __init__.py          # Enregistrement du blueprint docs
├── API_DOCUMENTATION.md      # Documentation complète en Markdown
└── README_API.md            # Ce fichier
```

## Utilisation

### Accéder à Swagger UI

Une fois le backend démarré :

```bash
docker-compose up backend
```

Accédez à : http://localhost:5000/api/docs/swagger/

### Tester les Endpoints

Swagger UI permet de :
- Voir tous les endpoints disponibles
- Comprendre les modèles de données
- Tester les endpoints directement depuis l'interface
- Voir les exemples de requêtes/réponses

## Ajouter de la Documentation

Pour documenter un nouvel endpoint :

1. **Créer le modèle de données** :

```python
from flask_restx import fields

my_model = api.model('MyModel', {
    'field1': fields.String(required=True, description='Description', example='example'),
    'field2': fields.Integer(description='Un nombre', example=42)
})
```

2. **Documenter l'endpoint** :

```python
@my_ns.route('/my-endpoint')
@my_ns.doc('my_endpoint')
class MyEndpoint(Resource):
    @my_ns.expect(my_model)
    @my_ns.marshal_with(response_model, code=200)
    @my_ns.response(400, 'Erreur', error_model)
    def post(self):
        """
        Description de l'endpoint
        
        Détails supplémentaires sur ce que fait l'endpoint.
        """
        pass
```

3. **Ajouter au namespace** :

```python
my_ns = Namespace('my', description='Ma section')
api.add_namespace(my_ns)
```

## Endpoints Documentés

### Health Checks
- `GET /health` - Health check simple
- `GET /health/detailed` - Health check détaillé
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur
- `GET /api/auth/oauth/google` - Redirection Google OAuth
- `POST /api/auth/oauth/google/callback` - Callback Google OAuth

## Format de Documentation

La documentation suit le standard OpenAPI 3.0 et inclut :

- **Modèles de données** : Schémas JSON pour les requêtes/réponses
- **Codes de statut** : Tous les codes HTTP possibles
- **Exemples** : Exemples de requêtes et réponses
- **Descriptions** : Documentation détaillée de chaque endpoint
- **Validation** : Règles de validation des données

## Export OpenAPI

Pour exporter le schéma OpenAPI :

```bash
curl http://localhost:5000/api/docs/swagger.json
```

Ce fichier peut être importé dans :
- Postman
- Insomnia
- Autres outils de test API
- Génération de clients API

## Maintenance

### Mettre à jour la Documentation

1. Modifier les modèles dans `app/api/docs.py`
2. Mettre à jour les descriptions des endpoints
3. Ajouter de nouveaux endpoints si nécessaire
4. Redémarrer le backend pour voir les changements

### Bonnes Pratiques

- Toujours documenter les nouveaux endpoints
- Inclure des exemples réalistes
- Documenter tous les codes de statut possibles
- Décrire les erreurs possibles
- Maintenir la cohérence avec l'implémentation réelle

## Support

Pour toute question :
- Consulter `API_DOCUMENTATION.md` pour la documentation complète
- Voir les exemples dans `app/api/docs.py`
- Tester via Swagger UI : http://localhost:5000/api/docs/swagger/



