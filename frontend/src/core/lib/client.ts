/**
 * Index des utilitaires côté client uniquement
 * Note: Désormais identique à index.ts car tous les modules serveur ont été supprimés
 */

// Gestion du temps et fuseaux horaires
export * from "./timezone";

// Fetchers SWR
export * from "./fetcher";
export * from "./mutations";
export * from "./swr-config";

// Hooks utilitaires
export * from "./useBodyScrollLock";
