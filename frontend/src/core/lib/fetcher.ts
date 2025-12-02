import useSWR, { SWRConfiguration } from "swr";

import { swrConfig } from "./swr-config";

/**
 * Custom hook for making HTTP requests using SWR with mock data.
 *
 * @template T - The type of the response data.
 * @param {string | null} url - The URL to send the request to. Pass `null` to skip fetching.
 * @param {SWRConfiguration} [swrOptions] - Optional SWR configuration options.
 * @returns {Object} - An object containing the response data, error, loading state, and mutate function.
 */
export function useFetch<T>(url: string | null, swrOptions?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, {
    ...swrConfig,
    ...swrOptions,
  });

  return { data, error, isLoading, mutate };
}
