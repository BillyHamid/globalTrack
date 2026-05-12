import { QueryClient } from "@tanstack/react-query"

/**
 * Defaults production-friendly : pas de refetch au focus, cache long,
 * déduplication automatique des requêtes identiques en cours (React Query).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})
