/**
 * 📚 EXEMPLES D'UTILISATION SWR - TEMPLATE FRONTEND
 *
 * Ce fichier contient des exemples d'utilisation des hooks SWR
 * pour vous aider à implémenter rapidement vos fonctionnalités.
 *
 * 🚀 Pour utiliser ces exemples :
 * 1. Adaptez les types selon vos données
 * 2. Modifiez les URLs d'API selon vos endpoints
 * 3. Personnalisez la logique métier selon vos besoins
 */

import { useState, useEffect } from "react";

import {
  useFetch,
  usePost,
  usePut,
  useDelete,
  usePatch,
} from "../../src/core/lib";

// =====================================================
// 🎯 EXEMPLES DE TYPES (à adapter selon votre projet)
// =====================================================

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface CreateUserData {
  name: string;
  email: string;
  role: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
}

// =====================================================
// 📖 LECTURE DE DONNÉES (GET)
// =====================================================

/**
 * Récupérer une liste d'utilisateurs
 */
export function useUsers(filters?: { role?: string; limit?: number }) {
  const { data, error, isLoading, mutate } = useFetch<User[]>(
    "/api/users",
    filters, // Paramètres de query
    { timeout: 10000 }, // Config Axios
    { refreshInterval: 30000 }, // Revalider toutes les 30s
  );

  return {
    users: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Récupérer un utilisateur spécifique
 */
export function useUser(userId: string | null) {
  const { data, error, isLoading, mutate } = useFetch<User>(
    userId ? `/api/users/${userId}` : null, // Requête conditionnelle
  );

  return {
    user: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

/**
 * Récupérer des données avec pagination
 */
export function usePaginatedUsers(page: number = 1, limit: number = 10) {
  const { data, error, isLoading } = useFetch<{
    users: User[];
    total: number;
    page: number;
    hasMore: boolean;
  }>("/api/users/paginated", { page, limit });

  return {
    users: data?.users || [],
    total: data?.total || 0,
    currentPage: data?.page || 1,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
  };
}

/**
 * Recherche avec debounce
 */
export function useUserSearch(query: string, debounceMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const { data, error, isLoading } = useFetch<User[]>(
    debouncedQuery ? `/api/users/search` : null,
    { q: debouncedQuery },
  );

  return {
    results: data || [],
    isLoading,
    error,
  };
}

// =====================================================
// ✏️ MUTATIONS (POST, PUT, DELETE, PATCH)
// =====================================================

/**
 * Créer un nouvel utilisateur
 */
export function useCreateUser() {
  const { trigger, isMutating, error, data } = usePost<CreateUserData, User>(
    "/api/users",
  );

  const createUser = async (userData: CreateUserData) => {
    try {
      const newUser = await trigger({ data: userData });

      // Optionnel : invalider le cache des utilisateurs pour les recharger
      // mutate("/api/users"); // Nécessite d'importer { mutate } de 'swr'

      return { success: true, user: newUser };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return {
    createUser,
    isCreating: isMutating,
    error,
    data,
  };
}

/**
 * Mettre à jour un utilisateur
 */
export function useUpdateUser(userId: string) {
  const { trigger, isMutating, error } = usePut<UpdateUserData, User>(
    `/api/users/${userId}`,
  );

  const updateUser = async (userData: UpdateUserData) => {
    try {
      const updatedUser = await trigger({ data: userData });

      // Invalider les caches liés à cet utilisateur
      // mutate(`/api/users/${userId}`);
      // mutate("/api/users");

      return { success: true, user: updatedUser };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return {
    updateUser,
    isUpdating: isMutating,
    error,
  };
}

/**
 * Supprimer un utilisateur
 */
export function useDeleteUser(userId: string) {
  const { trigger, isMutating, error } = useDelete<{
    success: boolean;
    message: string;
  }>(`/api/users/${userId}`);

  const deleteUser = async () => {
    try {
      const result = await trigger();

      // Invalider les caches
      // mutate("/api/users");

      return { success: true, result };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return {
    deleteUser,
    isDeleting: isMutating,
    error,
  };
}

/**
 * Mise à jour partielle (PATCH)
 */
export function usePatchUser(userId: string) {
  const { trigger, isMutating, error } = usePatch<Partial<User>, User>(
    `/api/users/${userId}`,
  );

  const patchUser = async (changes: Partial<User>) => {
    try {
      const result = await trigger({ data: changes });

      return { success: true, user: result };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return {
    patchUser,
    isPatching: isMutating,
    error,
  };
}

// =====================================================
// 🔄 GESTION AVANCÉE DU CACHE
// =====================================================

/**
 * Hook pour gérer les optimistic updates
 */
export function useOptimisticUsers() {
  const { data: users, mutate } = useFetch<User[]>("/api/users");
  const { trigger: createUser } = usePost<CreateUserData, User>("/api/users");

  const addUserOptimistic = async (newUser: CreateUserData) => {
    // Créer un utilisateur temporaire pour l'UI
    const tempUser: User = {
      id: `temp-${Date.now()}`,
      ...newUser,
      createdAt: new Date().toISOString(),
    };

    // Mettre à jour l'UI immédiatement
    await mutate([...(users || []), tempUser], false);

    try {
      // Faire la vraie requête
      const realUser = await createUser({ data: newUser });

      // Remplacer l'utilisateur temporaire par le vrai
      await mutate(
        users?.map((u) => (u.id === tempUser.id ? realUser : u)),
        false,
      );

      return { success: true };
    } catch (error) {
      // Annuler l'optimistic update en cas d'erreur
      await mutate(
        users?.filter((u) => u.id !== tempUser.id),
        false,
      );

      return { success: false, error };
    }
  };

  return { addUserOptimistic };
}

/**
 * Hook avec gestion d'erreurs avancée
 */
export function useUsersWithRetry() {
  const { data, error, isLoading, mutate } = useFetch<User[]>(
    "/api/users",
    undefined,
    undefined,
    {
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
        // Ne pas retry sur certaines erreurs
        if (err.status === 404 || err.status === 403) return;

        // Retry avec backoff exponentiel
        setTimeout(
          () => revalidate({ retryCount }),
          Math.pow(2, retryCount) * 1000,
        );
      },
    },
  );

  return {
    users: data || [],
    error,
    isLoading,
    retry: () => mutate(),
  };
}

// =====================================================
// 📝 NOTES D'UTILISATION
// =====================================================

/**
 * 💡 CONSEILS D'UTILISATION :
 *
 * 1. **Imports nécessaires** :
 *    import { useUsers, useCreateUser } from './path/to/this/file';
 *
 * 2. **Dans vos composants** :
 *    const { users, isLoading, error } = useUsers({ role: 'admin' });
 *    const { createUser, isCreating } = useCreateUser();
 *
 * 3. **Gestion d'erreurs** :
 *    if (error) return <ErrorComponent error={error} />;
 *    if (isLoading) return <LoadingSpinner />;
 *
 * 4. **Invalidation manuelle du cache** :
 *    import { mutate } from 'swr';
 *    await mutate('/api/users'); // Recharge les données
 *
 * 5. **Configuration globale** :
 *    Voir libs/swr-config.ts pour la configuration globale
 *
 * 6. **Typage TypeScript** :
 *    Définissez vos interfaces dans types/ et adaptez les exemples
 */

// =====================================================
// 🛠️ HOOKS UTILITAIRES PERSONNALISÉS
// =====================================================

/**
 * Hook pour gérer l'état de chargement global
 */
export function useGlobalLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  const setLoading = (key: string, isLoading: boolean) => {
    setLoadingStates((prev: Record<string, boolean>) => ({
      ...prev,
      [key]: isLoading,
    }));
  };

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return { setLoading, isAnyLoading, loadingStates };
}

/**
 * Hook pour précharger des données
 */
export function usePrefetch() {
  const prefetchUser = (userId: string) => {
    // Précharge les données sans les afficher
    useFetch<User>(`/api/users/${userId}`, undefined, undefined, {
      revalidateOnMount: false,
    });
  };

  const prefetchUsers = () => {
    useFetch<User[]>("/api/users", undefined, undefined, {
      revalidateOnMount: false,
    });
  };

  return { prefetchUser, prefetchUsers };
}
