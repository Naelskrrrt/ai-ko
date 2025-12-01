/**
 * Hook pour récupérer les détails d'un élève avec évaluations
 */
import useSWR from 'swr';
import { elevesService } from '../services/eleves.service';
import type { EleveDetails } from '../types/eleves.types';

export function useEleveDetails(eleveId: string | null) {
  const key = eleveId ? ['eleve-details', eleveId] : null;

  const { data, error, isLoading, mutate } = useSWR<EleveDetails>(
    key,
    () => {
      if (!eleveId) {
        throw new Error('Élève ID requis');
      }
      return elevesService.getEleveDetails(eleveId);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    eleveDetails: data,
    isLoading,
    isError: error,
    error,
    mutate,
  };
}

