# 📚 Guide SWR - Template Frontend

Ce template utilise **SWR (Stale-While-Revalidate)** comme solution complète pour la gestion des données et du cache. SWR offre une API simple et puissante pour récupérer, mettre en cache et synchroniser les données.

## 🚀 Configuration

### Configuration Globale (`libs/swr-config.ts`)

```typescript
export const swrConfig: SWRConfiguration = {
  fetcher: defaultFetcher,           // Fetcher Axios par défaut
  revalidateOnFocus: false,          // Pas de revalidation au focus
  revalidateOnReconnect: true,       // Revalidation à la reconnexion
  revalidateIfStale: true,           // Revalidation si données obsolètes
  dedupingInterval: 2000,            // Déduplication des requêtes (2s)
  focusThrottleInterval: 5000,       // Throttling du focus (5s)
  errorRetryCount: 3,                // 3 tentatives en cas d'erreur
  errorRetryInterval: 5000,          // 5s entre les tentatives
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Logique de retry personnalisée avec backoff exponentiel
  }
}
```

### Provider SWR (`app/providers.tsx`)

```typescript
<SWRConfig value={swrConfig}>
  {children}
</SWRConfig>
```

## 📖 Lecture de Données (GET)

### Hook `useFetch` Basique

```typescript
import { useFetch } from '@/libs/fetcher';

const { data, error, isLoading, mutate } = useFetch<User[]>('/api/users');
```

### Avec Paramètres de Requête

```typescript
const { data, error, isLoading } = useFetch<User[]>(
  '/api/users',
  { role: 'admin', limit: 10 }, // Query params
  { timeout: 5000 },            // Config Axios
  { refreshInterval: 30000 }     // Config SWR
);
```

### Requête Conditionnelle

```typescript
const { data: user } = useFetch<User>(
  userId ? `/api/users/${userId}` : null // null = pas de requête
);
```

## ✏️ Mutations (POST, PUT, DELETE, PATCH)

### Hooks de Mutations

```typescript
import { usePost, usePut, useDelete, usePatch } from '@/libs/mutations';

// POST - Création
const { trigger: createUser, isMutating } = usePost<CreateUserData, User>('/api/users');
const newUser = await createUser({ data: userData });

// PUT - Mise à jour complète
const { trigger: updateUser } = usePut<UpdateUserData, User>('/api/users/123');
await updateUser({ data: updatedData });

// DELETE - Suppression
const { trigger: deleteUser } = useDelete<{success: boolean}>('/api/users/123');
await deleteUser();

// PATCH - Mise à jour partielle
const { trigger: patchUser } = usePatch<Partial<User>, User>('/api/users/123');
await patchUser({ data: { name: 'New Name' } });
```

### Exemple Complet avec Gestion d'Erreurs

```typescript
function UserForm({ userId }: { userId?: string }) {
  const { trigger: saveUser, isMutating, error } = userId 
    ? usePut<UserData, User>(`/api/users/${userId}`)
    : usePost<UserData, User>('/api/users');

  const handleSubmit = async (formData: UserData) => {
    try {
      const result = await saveUser({ data: formData });
      
      // Invalider le cache pour recharger les données
      mutate('/api/users');
      mutate(`/api/users/${userId}`);
      
      return { success: true, user: result };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage error={error} />}
      <Button disabled={isMutating}>
        {isMutating ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
```

## 🔄 Gestion du Cache

### Invalidation Manuelle

```typescript
import { mutate } from 'swr';

// Recharger une ressource spécifique
await mutate('/api/users/123');

// Recharger toutes les ressources matchant un pattern
await mutate(key => typeof key === 'string' && key.startsWith('/api/users'));

// Mettre à jour le cache sans requête réseau
await mutate('/api/users', newUsersData, false);
```

### Optimistic Updates

```typescript
const addUserOptimistic = async (newUser: CreateUserData) => {
  const tempUser: User = { id: `temp-${Date.now()}`, ...newUser };
  
  // Mise à jour immédiate de l'UI
  await mutate('/api/users', [...(users || []), tempUser], false);
  
  try {
    // Vraie requête
    const realUser = await createUser({ data: newUser });
    
    // Remplacer l'utilisateur temporaire
    await mutate('/api/users', 
      users?.map(u => u.id === tempUser.id ? realUser : u), 
      false
    );
  } catch (error) {
    // Annuler en cas d'erreur
    await mutate('/api/users', 
      users?.filter(u => u.id !== tempUser.id), 
      false
    );
  }
};
```

## 🔧 Configuration API

### Variables d'Environnement

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Production
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
BACKEND_INTERNAL_URL=http://backend:8000  # URL interne Docker
```

### Client Axios (`libs/swr-config.ts`)

```typescript
export const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 30000,
  headers: { "Content-Type": "application/json" }
});

// Intercepteurs pour l'authentification
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🎯 Patterns Avancés

### Pagination

```typescript
function usePaginatedUsers(page: number = 1) {
  return useFetch<{
    users: User[];
    total: number;
    hasMore: boolean;
  }>('/api/users/paginated', { page, limit: 10 });
}
```

### Recherche avec Debounce

```typescript
function useUserSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useFetch<User[]>(
    debouncedQuery ? '/api/users/search' : null,
    { q: debouncedQuery }
  );
}
```

### Préchargement de Données

```typescript
function usePrefetch() {
  const prefetchUser = (userId: string) => {
    useFetch<User>(`/api/users/${userId}`, undefined, undefined, {
      revalidateOnMount: false, // Ne pas charger immédiatement
    });
  };
  
  return { prefetchUser };
}
```

## 🛠️ Authentification avec SWR

Le template inclut un hook d'authentification complet :

```typescript
import { useAuth } from '@/src/core/hooks';

function LoginForm() {
  const { login, logout, session, isAuthenticated, isLoggingIn } = useAuth();
  
  const handleLogin = async (credentials) => {
    const success = await login(credentials);
    if (!success) {
      // Gérer l'erreur
    }
  };
  
  if (isAuthenticated) {
    return <button onClick={logout}>Logout</button>;
  }
  
  return (
    <button onClick={() => handleLogin(creds)} disabled={isLoggingIn}>
      {isLoggingIn ? 'Logging in...' : 'Login'}
    </button>
  );
}
```

## 📝 Exemple d'Utilisation Complète

Voir le fichier `examples/swr-examples.tsx` pour des exemples détaillés d'utilisation incluant :

- ✅ Requêtes GET avec paramètres
- ✅ Mutations POST/PUT/DELETE/PATCH  
- ✅ Gestion d'erreurs et loading states
- ✅ Optimistic updates
- ✅ Invalidation de cache
- ✅ Pagination et recherche
- ✅ Préchargement de données

## 🚀 Pour Commencer

1. **Copiez les exemples** depuis `examples/swr-examples.tsx`
2. **Adaptez les types** selon vos données métier
3. **Modifiez les URLs** selon vos endpoints
4. **Personnalisez la logique** selon vos besoins
5. **Testez avec votre API** backend

## 🔗 Ressources Utiles

- [Documentation SWR](https://swr.vercel.app/)
- [Configuration Axios](https://axios-http.com/docs/config_defaults)
- [Patterns SWR Avancés](https://swr.vercel.app/docs/advanced/understanding)