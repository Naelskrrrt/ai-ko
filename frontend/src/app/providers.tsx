"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SWRConfig } from "swr";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { swrConfig } from "../core/lib/swr-config";
import { ColorThemeProvider } from "@/components/color-theme-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <NuqsAdapter>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <ColorThemeProvider>
            <SWRConfig value={swrConfig}>{children}</SWRConfig>
          </ColorThemeProvider>
        </NextThemesProvider>
      </HeroUIProvider>
    </NuqsAdapter>
  );
}
