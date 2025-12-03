# Architecture de Documentation API

## Problème Résolu

Avant cette refonte, le fichier `docs.py` créait des conflits de routes car :
1. Il utilisait le préfixe `/api` (même que les vraies routes)
2. Les classes `Resource` de flask_restx créaient automatiquement des routes
3. Ces routes de documentation prenaient la priorité sur les vraies implémentations

**Symptôme** : Toutes les valeurs retournées étaient `null` car la méthode `pass` de la documentation était appelée au lieu de la vraie implémentation.

## Solution Générique

### 1. Séparation des Préfixes

```python
# docs.py - Blueprint pour la DOCUMENTATION uniquement
api_bp = Blueprint('api_docs', __name__, url_prefix='/docs')

# admin.py, auth.py, etc. - Blueprints pour les VRAIES ROUTES
bp = Blueprint('admin', __name__, url_prefix='/api/admin')
```

**Résultat** :
- Documentation Swagger accessible à : `/docs/`
- Vraies routes API accessibles à : `/api/...`
- **Aucun conflit possible**

### 2. Règles Strictes pour docs.py

#### ✅ AUTORISÉ dans docs.py
- Définir des modèles de données (`api.model()`)
- Créer des namespaces pour organiser la documentation
- Documenter les endpoints avec des classes Resource

#### ❌ INTERDIT dans docs.py
- Importer et ajouter des namespaces réels d'autres fichiers
- Implémenter de la logique métier dans les méthodes Resource
- Utiliser le même préfixe que les vraies routes (`/api`)

### 3. Structure Recommandée

```
app/api/
├── docs.py              # Documentation Swagger uniquement (préfixe /docs)
├── admin.py             # Routes admin réelles (préfixe /api/admin)
├── auth.py              # Routes auth réelles (préfixe /api/auth)
├── health.py            # Routes health réelles (préfixe /api/health)
└── README_DOCUMENTATION.md  # Ce fichier
```

## Utilisation

### Accès à la Documentation

```bash
# Interface Swagger UI
http://localhost:5000/docs/

# Spécification OpenAPI JSON
http://localhost:5000/docs/swagger.json
```

### Exemple : Ajouter un Nouvel Endpoint

#### 1. Créer la vraie route dans le fichier approprié

```python
# app/api/admin.py
@bp.route('/users/<user_id>/status', methods=['PATCH'])
@require_role('admin')
def toggle_user_status(current_user, user_id):
    """Active ou désactive un utilisateur"""
    # Vraie implémentation ici
    return jsonify(result), 200
```

#### 2. (Optionnel) Documenter dans docs.py

```python
# app/api/docs.py

# Définir les modèles de réponse
toggle_status_model = api.model('ToggleStatusResponse', {
    'success': fields.Boolean(),
    'message': fields.String(),
    # ...
})

# NE PAS créer de Resource pour éviter les conflits
# Les vraies routes sont dans admin.py
```

## Vérification des Conflits

Pour vérifier qu'il n'y a pas de conflit de routes :

```python
from app import create_app
app = create_app()
with app.app_context():
    for rule in app.url_map.iter_rules():
        if 'status' in str(rule):
            print(f'{rule.methods} {rule.rule} -> {rule.endpoint}')
```

**Résultat attendu** : Une seule route par endpoint

```
{'OPTIONS', 'PATCH'} /api/admin/users/<user_id>/status -> admin.toggle_user_status
```

## Migration d'Anciens Endpoints

Si vous trouvez un endpoint documenté dans `docs.py` avec une classe Resource :

1. **Vérifier** s'il y a une implémentation réelle dans un autre fichier
2. **Supprimer** la classe Resource de `docs.py`
3. **Conserver** uniquement les modèles de données
4. **Redémarrer** le serveur pour appliquer les changements

## Checklist de Validation

Avant de déployer :

- [ ] Aucune classe `Resource` dans `docs.py` qui duplique une vraie route
- [ ] Le préfixe de `docs.py` est `/docs` (pas `/api`)
- [ ] Les vraies routes sont dans leurs fichiers respectifs avec le préfixe `/api`
- [ ] La documentation Swagger est accessible à `/docs/`
- [ ] Les endpoints réels fonctionnent correctement
- [ ] Aucun conflit de routes détecté

## Dépannage

### Problème : Les valeurs retournées sont `null`

**Cause** : Une classe Resource dans `docs.py` crée une route qui prend la priorité

**Solution** :
1. Supprimer la classe Resource de `docs.py`
2. Redémarrer le serveur backend
3. Vérifier avec curl que l'endpoint fonctionne

### Problème : La documentation Swagger est vide

**Cause** : Les namespaces ne sont pas ajoutés à l'API de documentation

**Solution** :
1. Vérifier que les namespaces sont créés avec `Namespace(...)`
2. Vérifier que `api.add_namespace()` est appelé
3. Les classes Resource doivent avoir des décorateurs comme `@ns.route()`

## Références

- [Flask-RESTX Documentation](https://flask-restx.readthedocs.io/)
- [OpenAPI Specification](https://swagger.io/specification/)
