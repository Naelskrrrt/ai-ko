/**
 * Hook pour récupérer la liste des élèves liés à un enseignant
 */
import useSWR from 'swr';
import { elevesService } from '../services/eleves.service';
import type { ElevesListResponse, EleveFilters } from '../types/eleves.types';

export function useEleves(
  enseignantId: string | null,
  filters?: EleveFilters
) {
  const key = enseignantId
    ? ['eleves-enseignant', enseignantId, filters]
    : null;

  const { data, error, isLoading, mutate } = useSWR<ElevesListResponse>(
    key,
    () => {
      if (!enseignantId) {
        throw new Error('Enseignant ID requis');
      }
      return elevesService.getElevesLies(enseignantId, filters);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    eleves: data?.items || [],
    total: data?.total || 0,
    page: data?.page || 1,
    perPage: data?.per_page || 50,
    totalPages: data?.total_pages || 0,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

