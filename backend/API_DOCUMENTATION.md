# Documentation API AI-KO

## Accès à la Documentation

La documentation interactive de l'API est disponible via Swagger UI :

- **URL de développement** : http://localhost:5000/api/docs/swagger/
- **URL de production** : https://votre-domaine.com/api/docs/swagger/

## Endpoints d'Authentification

### Base URL
```
http://localhost:5000/api/auth
```

### 1. Inscription

**POST** `/api/auth/register`

Crée un nouveau compte utilisateur.

#### Requête

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Réponse Succès (201)

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": null,
    "emailVerified": false,
    "createdAt": "2025-01-21T10:00:00",
    "updatedAt": "2025-01-21T10:00:00"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Réponse Erreur (400)

```json
{
  "message": "Cet email est déjà utilisé"
}
```

#### Codes de Statut

- `201` - Utilisateur créé avec succès
- `400` - Erreur de validation (email déjà utilisé, champs manquants)
- `500` - Erreur serveur

---

### 2. Connexion

**POST** `/api/auth/login`

Authentifie un utilisateur avec email et mot de passe.

#### Requête

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Réponse Succès (200)

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@example.com",
    "name": "John Doe",
    "avatar": null,
    "emailVerified": false,
    "createdAt": "2025-01-21T10:00:00",
    "updatedAt": "2025-01-21T10:00:00"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Réponse Erreur (401)

```json
{
  "message": "Email ou mot de passe incorrect"
}
```

#### Codes de Statut

- `200` - Connexion réussie
- `400` - Champs manquants
- `401` - Identifiants incorrects
- `500` - Erreur serveur

---

### 3. Déconnexion

**POST** `/api/auth/logout`

Déconnecte l'utilisateur actuel.

#### Headers Requis

```
Authorization: Bearer <token>
```

ou

Le token doit être présent dans le cookie `auth_token`.

#### Réponse Succès (200)

```json
{
  "message": "Déconnexion réussie"
}
```

#### Codes de Statut

- `200` - Déconnexion réussie
- `401` - Non authentifié

---

### 4. Profil Utilisateur

**GET** `/api/auth/me`

Récupère les informations de l'utilisateur connecté.

#### Headers Requis

```
Authorization: Bearer <token>
```

ou

Le token doit être présent dans le cookie `auth_token`.

#### Réponse Succès (200)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "emailVerified": true,
  "createdAt": "2025-01-21T10:00:00",
  "updatedAt": "2025-01-21T10:00:00"
}
```

#### Réponse Erreur (401)

```json
{
  "message": "Non authentifié"
}
```

#### Codes de Statut

- `200` - Profil récupéré avec succès
- `401` - Non authentifié
- `404` - Utilisateur non trouvé

---

### 5. Google OAuth - Redirection

**GET** `/api/auth/oauth/google`

Récupère l'URL de redirection vers Google OAuth.

#### Réponse Succès (200)

```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=..."
}
```

#### Réponse Erreur (500)

```json
{
  "message": "Google OAuth non configuré"
}
```

#### Codes de Statut

- `200` - URL générée avec succès
- `500` - Google OAuth non configuré

---

### 6. Google OAuth - Callback

**POST** `/api/auth/oauth/google/callback`

Traite le code OAuth retourné par Google.

#### Requête

```json
{
  "code": "4/0Aean..."
}
```

#### Réponse Succès (200)

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john@gmail.com",
    "name": "John Doe",
    "avatar": "https://lh3.googleusercontent.com/...",
    "emailVerified": true,
    "createdAt": "2025-01-21T10:00:00",
    "updatedAt": "2025-01-21T10:00:00"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Réponse Erreur (400)

```json
{
  "message": "Code OAuth manquant"
}
```

#### Codes de Statut

- `200` - Connexion Google réussie
- `400` - Code OAuth manquant ou invalide
- `500` - Erreur OAuth

---

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. Le token peut être fourni de deux manières :

### 1. Header Authorization

```
Authorization: Bearer <token>
```

### 2. Cookie

Le token est automatiquement stocké dans un cookie `auth_token` lors de la connexion/inscription.

### Expiration

Les tokens JWT sont valides pendant **7 jours**.

---

## Gestion des Erreurs

Toutes les erreurs suivent le format suivant :

```json
{
  "message": "Description de l'erreur"
}
```

### Codes de Statut HTTP

- `200` - Succès
- `201` - Créé
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Interdit
- `404` - Non trouvé
- `500` - Erreur serveur

---

## Exemples d'Utilisation

### cURL

#### Inscription

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Connexion

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

#### Récupérer le profil

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### JavaScript (Fetch)

#### Inscription

```javascript
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  })
});

const data = await response.json();
```

#### Connexion

```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const data = await response.json();
// Le token est automatiquement stocké dans le cookie
```

#### Récupérer le profil

```javascript
const response = await fetch('http://localhost:5000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  credentials: 'include',
});

const user = await response.json();
```

### Python (requests)

#### Inscription

```python
import requests

response = requests.post(
    'http://localhost:5000/api/auth/register',
    json={
        'name': 'John Doe',
        'email': 'john@example.com',
        'password': 'password123'
    }
)

data = response.json()
token = data['token']
```

#### Connexion

```python
import requests

response = requests.post(
    'http://localhost:5000/api/auth/login',
    json={
        'email': 'john@example.com',
        'password': 'password123'
    }
)

data = response.json()
token = data['token']
```

#### Récupérer le profil

```python
import requests

headers = {
    'Authorization': f'Bearer {token}'
}

response = requests.get(
    'http://localhost:5000/api/auth/me',
    headers=headers
)

user = response.json()
```

---

## Validation

### Inscription

- `name` : Requis, minimum 2 caractères
- `email` : Requis, format email valide
- `password` : Requis, minimum 6 caractères

### Connexion

- `email` : Requis, format email valide
- `password` : Requis

---

## Sécurité

- Les mots de passe sont hashés avec **bcrypt** avant stockage
- Les tokens JWT sont signés avec une clé secrète
- Les cookies sont configurés en **httpOnly** pour prévenir les attaques XSS
- CORS est configuré pour autoriser uniquement les origines autorisées
- Les tokens expirent après 7 jours

---

## Support

Pour toute question ou problème, consultez :
- La documentation Swagger UI : http://localhost:5000/api/docs/swagger/
- Le fichier `AUTHENTICATION_SETUP.md` pour la configuration
- Les logs du backend : `docker-compose logs backend`



