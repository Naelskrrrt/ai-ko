import useSWR from "swr";

import type { AIModelConfig } from "../types/admin.types";
import { adminService } from "../services/api/admin.service";

export function useAIConfigs() {
  const { data, error, mutate, isLoading } = useSWR<AIModelConfig[]>(
    "ai-configs",
    () => adminService.getAIConfigs(),
  );

  return {
    configs: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

export function useAIConfig(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR<AIModelConfig>(
    id ? ["ai-config", id] : null,
    id ? () => adminService.getAIConfigById(id) : null,
  );

  return {
    config: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}

export function useDefaultAIConfig() {
  const { data, error, mutate, isLoading } = useSWR<AIModelConfig>(
    "ai-config-default",
    () => adminService.getDefaultAIConfig(),
  );

  return {
    defaultConfig: data || null,
    isLoading,
    isError: error,
    mutate,
  };
}


