import type {
  User,
  UsersFilters,
  PaginatedResponse,
} from "../types/admin.types";

import useSWR from "swr";

import { adminService } from "../services/api/admin.service";

export function useUsers(filters: UsersFilters = {}) {
  const key = ["users", JSON.stringify(filters)];

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<User>>(
    key,
    () => adminService.getUsers(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    },
  );

  return {
    users: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}
