import { SWRConfiguration } from "swr";

/**
 * Mock fetcher function for SWR - Returns mock data
 * En mode démo, retourne des données statiques
 *
 * @template T - The type of the data to be fetched.
 * @param {string} url - The URL to fetch the data from.
 * @returns {Promise<T>} - A promise that resolves to mock data.
 */
const mockFetcher = async <T>(url: string): Promise<T> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Return mock data based on URL
  const mockResponses: Record<string, any> = {
    "/api/users": [
      {
        id: 1,
        name: "Alice Dupont",
        email: "alice@example.com",
        role: "Admin",
      },
      { id: 2, name: "Bob Martin", email: "bob@example.com", role: "User" },
      { id: 3, name: "Carol Singh", email: "carol@example.com", role: "User" },
    ],
    "/api/dashboard": {
      totalUsers: 156,
      activeProjects: 12,
      completedTasks: 348,
      pendingItems: 23,
    },
  };

  return mockResponses[url] || { message: "Mock data from " + url };
};

/**
 * Global SWR configuration for the application
 * This provides default settings for all SWR hooks throughout the app
 */
export const swrConfig: SWRConfiguration = {
  fetcher: mockFetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: true,
  dedupingInterval: 2000,
  focusThrottleInterval: 5000,
  errorRetryCount: 0,
  onError: (error) => {
    // Global error handling
    // eslint-disable-next-line no-console
    console.error("SWR Error:", error);
  },
};

/**
 * Helper function to create SWR keys with parameters
 * Useful for creating consistent cache keys across the application
 */
export const createSWRKey = (
  endpoint: string,
  params?: Record<string, any>,
): [string, Record<string, any>] | null => {
  if (!endpoint) return null;

  return [endpoint, params || {}];
};
