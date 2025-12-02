/**
 * Hooks de mutations SWR pour les opérations POST, PUT, DELETE
 * Version démo avec données mockées
 */

import useSWRMutation from "swr/mutation";

/**
 * Fonction générique mock pour les requêtes POST
 */
async function postFetcher<T>(url: string, { arg }: { arg?: any }): Promise<T> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // eslint-disable-next-line no-console
  console.log("📤 POST", url, arg);

  return { success: true, id: Math.random() } as T;
}

/**
 * Fonction générique mock pour les requêtes PUT
 */
async function putFetcher<T>(url: string, { arg }: { arg?: any }): Promise<T> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // eslint-disable-next-line no-console
  console.log("📝 PUT", url, arg);

  return { success: true } as T;
}

/**
 * Fonction générique mock pour les requêtes DELETE
 */
async function deleteFetcher<T>(
  url: string,
  { arg }: { arg?: any },
): Promise<T> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // eslint-disable-next-line no-console
  console.log("🗑️ DELETE", url);

  return { success: true } as T;
}

/**
 * Fonction générique mock pour les requêtes PATCH
 */
async function patchFetcher<T>(
  url: string,
  { arg }: { arg?: any },
): Promise<T> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // eslint-disable-next-line no-console
  console.log("🔧 PATCH", url, arg);

  return { success: true } as T;
}

/**
 * Hook pour les mutations POST
 * @param url - URL de l'endpoint
 * @returns Objet avec trigger, data, error, isMutating
 */
export function usePost<TData = any, TResult = any>(url: string) {
  return useSWRMutation<TResult, Error, string, { data?: TData } | undefined>(
    url,
    postFetcher,
  );
}

/**
 * Hook pour les mutations PUT
 * @param url - URL de l'endpoint
 * @returns Objet avec trigger, data, error, isMutating
 */
export function usePut<TData = any, TResult = any>(url: string) {
  return useSWRMutation<TResult, Error, string, { data?: TData } | undefined>(
    url,
    putFetcher,
  );
}

/**
 * Hook pour les mutations DELETE
 * @param url - URL de l'endpoint
 * @returns Objet avec trigger, data, error, isMutating
 */
export function useDelete<TResult = any>(url: string) {
  return useSWRMutation<TResult, Error, string, undefined>(url, deleteFetcher);
}

/**
 * Hook pour les mutations PATCH
 * @param url - URL de l'endpoint
 * @returns Objet avec trigger, data, error, isMutating
 */
export function usePatch<TData = any, TResult = any>(url: string) {
  return useSWRMutation<TResult, Error, string, { data?: TData } | undefined>(
    url,
    patchFetcher,
  );
}

/**
 * Exemple d'utilisation :
 *
 * // POST
 * const { trigger: createUser, isMutating } = usePost<CreateUserData, User>('/api/users');
 * await trigger({ data: userData });
 *
 * // PUT
 * const { trigger: updateUser } = usePut<UpdateUserData, User>('/api/users/123');
 * await trigger({ data: updatedData });
 *
 * // DELETE
 * const { trigger: deleteUser } = useDelete<{ success: boolean }>('/api/users/123');
 * await trigger();
 *
 * // PATCH
 * const { trigger: patchUser } = usePatch<Partial<User>, User>('/api/users/123');
 * await trigger({ data: { name: 'New Name' } });
 */
