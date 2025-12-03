import type {
  Professeur,
  UsersFilters,
  PaginatedResponse,
} from "../types/admin.types";

import useSWR from "swr";

import { adminService } from "../services/api/admin.service";

export function useProfesseurs(filters: UsersFilters = {}) {
  const { data, error, mutate, isLoading } = useSWR<
    PaginatedResponse<Professeur>
  >(["professeurs", filters], () => adminService.getProfesseurs(filters));

  return {
    professeurs: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useProfesseur(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<Professeur>(
    id ? ["professeur", id] : null,
    id ? () => adminService.getProfesseurById(id) : null,
  );

  return {
    professeur: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}


