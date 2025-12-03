import type {
  Etudiant,
  UsersFilters,
  PaginatedResponse,
} from "../types/admin.types";

import useSWR from "swr";

import { adminService } from "../services/api/admin.service";

export function useEtudiants(filters: UsersFilters = {}) {
  const { data, error, mutate, isLoading } = useSWR<
    PaginatedResponse<Etudiant>
  >(["etudiants", filters], () => adminService.getEtudiants(filters));

  return {
    etudiants: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useEtudiant(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<Etudiant>(
    id ? ["etudiant", id] : null,
    id ? () => adminService.getEtudiantById(id) : null,
  );

  return {
    etudiant: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}


