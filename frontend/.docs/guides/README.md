# 🚀 Template Frontend Next.js + SWR

Un template moderne et complet pour développer des applications frontend avec **Next.js 15**, **SWR**, **HeroUI v2** et **TypeScript**.

## ✨ Fonctionnalités

- ⚡ **Next.js 15** avec App Router et Turbopack
- 📊 **SWR** pour la gestion des données et du cache
- 🎨 **HeroUI v2** pour les composants UI modernes
- 🔥 **TypeScript** avec configuration stricte
- 🎯 **Tailwind CSS v4** pour le styling
- 🔐 **Authentification** avec gestion des sessions
- 🌙 **Dark/Light Mode** avec next-themes
- 📱 **Responsive Design** natif
- 🔄 **API Proxy** universel vers le backend
- 🛠️ **Configuration multi-environnement**
- 📚 **Documentation complète** et exemples

## 🏗️ Architecture

```
frontend/
├── app/                    # App Router Next.js 15
│   ├── api/               # API Routes (auth + proxy)
│   ├── dashboard/         # Pages protégées
│   └── login/             # Authentification
├── components/            # Composants réutilisables
│   ├── layout/           # Composants de layout
│   └── primitives.ts     # Utilitaires UI
├── hooks/                # Hooks personnalisés
├── libs/                 # Logique métier et configuration
│   ├── swr-config.ts    # Configuration SWR globale
│   ├── fetcher.ts       # Hook useFetch personnalisé
│   └── mutations.ts     # Hooks de mutations SWR
├── config/               # Configuration de l'app
├── types/                # Types TypeScript
├── docs/                 # Documentation
└── examples/             # Exemples d'utilisation
```

## 🚀 Démarrage Rapide

### 1. Installation

```bash
npm install
# ou
yarn install
```

### 2. Configuration

Créez un fichier `.env.local` :

```bash
# URL de votre API backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optionnel : URL interne pour Docker/production
BACKEND_INTERNAL_URL=http://backend:8000
```

### 3. Personnalisation

#### Configuration du Site (`config/site.ts`)
```typescript
export const siteConfig = {
  name: "Your App Name",
  description: "Your app description",
  // ... autres configurations
};
```

#### Configuration API (`config/api.ts`)
```typescript
export const API_ENDPOINTS = {
  // Ajoutez vos endpoints ici
  users: "/users",
  profile: "/profile",
};
```

### 4. Lancement

```bash
npm run dev
# ou
yarn dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📚 Utilisation de SWR

### Lecture de Données

```typescript
import { useFetch } from '@/libs/fetcher';

function UsersList() {
  const { data: users, error, isLoading } = useFetch<User[]>('/api/users');

  if (error) return <div>Erreur de chargement</div>;
  if (isLoading) return <div>Chargement...</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Mutations

```typescript
import { usePost, usePut, useDelete } from '@/libs/mutations';

function UserForm({ userId }: { userId?: string }) {
  const { trigger: saveUser, isMutating } = userId 
    ? usePut<UserData, User>(`/api/users/${userId}`)
    : usePost<UserData, User>('/api/users');

  const handleSubmit = async (formData: UserData) => {
    try {
      const result = await saveUser({ data: formData });
      // Succès !
    } catch (error) {
      // Gestion d'erreur
    }
  };

  return (
    <Button disabled={isMutating} onClick={() => handleSubmit(data)}>
      {isMutating ? 'Saving...' : 'Save'}
    </Button>
  );
}
```

### Authentification

```typescript
// Importation du hook d'authentification
import { useAuth } from '@/src/core/hooks';

function LoginForm() {
  const { login, isLoggingIn, isAuthenticated } = useAuth();

  const handleLogin = async (credentials) => {
    const success = await login(credentials);
    // Redirection automatique si succès
  };

  if (isAuthenticated) return <Dashboard />;

  return (
    <Button 
      disabled={isLoggingIn}
      onClick={() => handleLogin({ username: '...', password: '...' })}
    >
      {isLoggingIn ? 'Logging in...' : 'Login'}
    </Button>
  );
}
```

## 🎨 Interface Utilisateur

### Composants HeroUI

```typescript
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";

function MyComponent() {
  return (
    <Card>
      <CardBody>
        <Input label="Username" />
        <Button color="primary">Submit</Button>
      </CardBody>
    </Card>
  );
}
```

### Layout Responsive

Le template inclut un système de layout intelligent qui s'adapte automatiquement :

- **Layout Simple** : Pages publiques (login, etc.)
- **Layout Dashboard** : Pages avec sidebar et navigation
- **Layout Fullwidth** : Pages nécessitant toute la largeur

## 🔧 Configuration Avancée

### Variables d'Environnement

```bash
# .env.local (développement)
NEXT_PUBLIC_API_URL=http://localhost:8000

# .env.production (production)  
NEXT_PUBLIC_API_URL=https://api.your-domain.com
BACKEND_INTERNAL_URL=http://backend:8000
```

### Personnalisation SWR

Modifiez `libs/swr-config.ts` pour adapter la configuration SWR :

```typescript
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  errorRetryCount: 3,
  dedupingInterval: 2000,
  // ... autres options
};
```

### Intercepteurs Axios

Les intercepteurs sont configurés pour :
- ✅ Ajouter automatiquement les tokens d'authentification
- ✅ Gérer les erreurs globalement (401 → redirect login)
- ✅ Logger les requêtes en mode développement

## 📡 API Backend

### Proxy Universel

Toutes les requêtes vers `/api/*` (sauf auth) sont automatiquement proxifiées vers votre backend :

```
Frontend: /api/users → Backend: http://your-api:8000/users
Frontend: /api/products → Backend: http://your-api:8000/products
```

### Authentification

Le template inclut des routes d'authentification prêtes à l'emploi :
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion  
- `GET /api/auth/session` - Vérification de session

## 🎯 Exemples Inclus

### Fichiers d'Exemples
- `examples/swr-examples.tsx` - Patterns SWR avancés
- `docs/SWR_GUIDE.md` - Guide complet SWR

### Patterns Courants
- ✅ CRUD complet avec SWR
- ✅ Optimistic updates
- ✅ Pagination et recherche
- ✅ Gestion d'erreurs
- ✅ Loading states
- ✅ Cache invalidation

## 🚀 Déploiement

### Build Production

```bash
npm run build
npm start
```

### Docker (optionnel)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Variables d'Environnement Production

Configurez ces variables sur votre plateforme de déploiement :

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com
BACKEND_INTERNAL_URL=http://backend:8000  # URL interne si Docker
```

## 📚 Documentation

- [📊 Guide SWR Complet](./docs/SWR_GUIDE.md)
- [🎨 Composants HeroUI](https://heroui.com)
- [⚡ Next.js 15 Documentation](https://nextjs.org/docs)
- [🔧 Configuration TypeScript](https://www.typescriptlang.org/)

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Développement avec Turbopack
npm run build        # Build de production
npm run start        # Serveur de production
npm run lint         # Linting avec ESLint
```

## 🤝 Contribution

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Pushez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

🎉 **Happy Coding !** Ce template vous donne une base solide pour développer rapidement des applications frontend modernes avec les meilleures pratiques.

Pour toute question ou amélioration, n'hésitez pas à ouvrir une issue !