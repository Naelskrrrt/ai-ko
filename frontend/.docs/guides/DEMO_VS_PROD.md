# 🔄 Guide Demo vs Production

Ce template frontend supporte **deux modes de fonctionnement** pour faciliter le développement et l'intégration avec un backend.

---

## 📊 Vue d'Ensemble

| Aspect | Mode DÉMO | Mode PRODUCTION |
|--------|-----------|-----------------|
| **Backend requis** | ❌ Non | ✅ Oui |
| **Authentification** | 🎭 Mockée (toujours connecté) | 🔒 JWT réelle |
| **Données API** | 📦 Mockées | 🔗 Depuis le backend |
| **Tokens** | Simulés | Vrais JWT |
| **Middleware** | Bypass | Protection des routes |
| **Utilisation** | Développement rapide, démos | Production, développement avec backend |

---

## 🚀 Activation des Modes

### Mode DÉMO (par défaut)

``bash
# .env.local
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_API_URL=http://localhost:8000  # Optionnel
```

✅ **Parfait pour** :
- Développement frontend sans backend
- Prototypage rapide
- Démonstrations
- Tests UI/UX

### Mode PRODUCTION

```bash
# .env.local
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_INTERNAL_URL=http://backend:8000  # Pour Docker/SSR
JWT_SECRET=votre-cle-secrete
```

✅ **Parfait pour** :
- Développement avec backend
- Tests d'intégration
- Staging
- Production

---

## 🏗️ Architecture en Mode Production

```
┌─────────────────────────────────────────┐
│          FRONTEND (Next.js)             │
│                                         │
│  1. Middleware                          │
│     ├─ Vérifie présence token          │
│     └─ Redirect /login si absent       │
│                                         │
│  2. Routes API (/api/*)                 │
│     ├─ /api/auth/* → Gestion auth      │
│     └─ /api/[...path] → Proxy backend  │
│                                         │
│  3. Hooks useAuth                       │
│     ├─ Login/Logout                     │
│     ├─ Refresh auto des tokens         │
│     └─ Gestion session                  │
│                                         │
└─────────────────┬───────────────────────┘
                  │ HTTP + Bearer Token
                  ▼
┌─────────────────────────────────────────┐
│        BACKEND (FastAPI/Django/etc)     │
│                                         │
│  ├─ POST /auth/login                    │
│  │   → Valide credentials              │
│  │   → Génère JWT                       │
│  │                                      │
│  ├─ POST /auth/refresh                  │
│  │   → Valide refresh token            │
│  │   → Nouveau access token            │
│  │                                      │
│  ├─ GET /auth/me                        │
│  │   → Valide JWT                       │
│  │   → Retourne user                    │
│  │                                      │
│  └─ Autres routes                       │
│      → Vérifient JWT sur chaque appel  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔗 Intégration Backend

### Endpoints Requis

Votre backend doit exposer ces endpoints :

#### 1. **POST /auth/login**

Authentifie l'utilisateur et retourne les tokens.

**Request :**
```json
{
  "username": "user",
  "password": "pass",
  "rememberMe": false
}
```

**Response (200) :**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "username": "user",
    "email": "user@example.com",
    "role": "admin",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "tokenType": "Bearer",
    "expiresIn": 900
  }
}
```

**Response (401) :**
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "message": "Identifiants incorrects"
}
```

---

#### 2. **POST /auth/refresh**

Rafraîchit le token d'accès.

**Request :**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200) :**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",  // Optionnel (rotation)
  "expiresIn": 900
}
```

---

#### 3. **GET /auth/me**

Retourne l'utilisateur courant.

**Headers :**
```
Authorization: Bearer eyJhbGc...
```

**Response (200) :**
```json
{
  "id": "user_123",
  "username": "user",
  "email": "user@example.com",
  "role": "admin",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

#### 4. **POST /auth/logout**

Invalide les tokens (optionnel mais recommandé).

**Headers :**
```
Authorization: Bearer eyJhbGc...
```

**Response (200) :**
```json
{
  "success": true,
  "message": "Logged out"
}
```

---

### Autres Routes API

Toutes vos routes métier doivent :
1. ✅ Accepter le header `Authorization: Bearer <token>`
2. ✅ Valider le JWT
3. ✅ Retourner 401 si token invalide/expiré
4. ✅ Retourner JSON

**Exemple :**
```
Frontend: GET /api/users
         ↓ (proxy automatique)
Backend:  GET http://localhost:8000/users
```

---

## 📝 Exemples d'Implémentation Backend

### FastAPI

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = "votre-cle-secrete"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

def create_access_token(user: dict):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": user["id"],
        "username": user["username"],
        "role": user["role"],
        "exp": expire
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Valider credentials (DB, etc.)
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(401, "Invalid credentials")
    
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    
    return {
        "success": True,
        "user": user,
        "tokens": {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "tokenType": "Bearer",
            "expiresIn": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    }

@app.get("/auth/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = get_user_by_id(user_id)
        if not user:
            raise HTTPException(404, "User not found")
        return user
    except JWTError:
        raise HTTPException(401, "Invalid token")

@app.get("/users")
async def get_users(current_user = Depends(get_current_user)):
    # Protégé automatiquement par le Depends
    return get_all_users()
```

---

### Django + DRF

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

@api_view(['POST'])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=401)
    
    refresh = RefreshToken.for_user(user)
    
    return Response({
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.profile.role
        },
        "tokens": {
            "accessToken": str(refresh.access_token),
            "refreshToken": str(refresh),
            "tokenType": "Bearer",
            "expiresIn": 900
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        "id": request.user.id,
        "username": request.user.username,
        "email": request.user.email
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    # Protégé automatiquement
    users = User.objects.all()
    return Response(UserSerializer(users, many=True).data)
```

---

### Express.js

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const SECRET_KEY = 'votre-cle-secrete';
const ACCESS_TOKEN_EXPIRY = '15m';

// Login
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Valider credentials
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    SECRET_KEY,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    tokens: {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900
    }
  });
});

// Middleware d'authentification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Current user
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Protected route
app.get('/users', authenticateToken, async (req, res) => {
  const users = await User.find();
  res.json(users);
});
```

---

## 🔒 Sécurité

### Côté Backend (OBLIGATOIRE)

✅ **Valider le JWT sur CHAQUE requête**
✅ **Vérifier la signature avec SECRET_KEY**
✅ **Vérifier l'expiration**
✅ **Hash les mots de passe** (bcrypt, argon2)
✅ **HTTPS en production**
✅ **Rate limiting** sur /auth/login
✅ **Blacklist des tokens** (Redis)

### Côté Frontend

✅ **Cookies HttpOnly** pour les tokens
✅ **Pas de localStorage** pour les tokens sensibles
✅ **CSRF protection** (SameSite cookies)
✅ **Nettoyage automatique** des tokens expirés

---

## 🐛 Debugging

### Vérifier le Mode Actif

Regardez dans la console browser :
```
🔐 Mode d'authentification : 🎭 DÉMO
```
ou
```
🔐 Mode d'authentification : 🔒 PRODUCTION
```

### Logs API Proxy

```
[API Proxy] Response 200 for GET /users
[API Proxy] 401 detected, attempting token refresh...
[API Proxy] Token refreshed, retrying request...
```

### Test du Backend

```bash
# Test login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pass"}'

# Test route protégée
curl http://localhost:8000/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Checklist de Migration Demo → Prod

- [ ] Backend opérationnel avec endpoints /auth/*
- [ ] Backend valide les JWT
- [ ] Définir `NEXT_PUBLIC_DEMO_MODE=false`
- [ ] Configurer `NEXT_PUBLIC_API_URL`
- [ ] Configurer `JWT_SECRET`
- [ ] Tester le login
- [ ] Tester le refresh automatique
- [ ] Tester une route protégée
- [ ] Vérifier le middleware
- [ ] Tester le logout

---

## 💡 Conseils

### Développement Parallèle

Lancez les deux serveurs :

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Env par Mode

```bash
# .env.local.demo
NEXT_PUBLIC_DEMO_MODE=true

# .env.local.prod
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_API_URL=http://localhost:8000
JWT_SECRET=...
```

Switchez avec :
```bash
cp .env.local.demo .env.local   # Mode démo
cp .env.local.prod .env.local   # Mode prod
```

---

## 📚 Ressources

- [Guide JWT](https://jwt.io/introduction)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Django REST Framework JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**🎉 Votre template est maintenant prêt pour la production !**
