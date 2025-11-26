import React from "react";
import { useTheme } from "next-themes";
import { useIsSSR } from "@react-aria/ssr";

export const Footer = () => {
  const { theme } = useTheme();
  const isSSR = useIsSSR();

  // Pendant l'hydratation, utiliser le thème par défaut pour éviter les erreurs d'hydratation
  const logoSrc =
    isSSR || theme === "dark"
      ? "/logo-capt_dark-mode.png"
      : "/logo-capt_light-mode.png";

  return (
    <footer className="layout-footer layout-footer-height w-full flex items-center justify-center border-t-2 border-divider/60 flex-shrink-0 bg-background/80 shadow-sm">
      <div className="flex items-center gap-2 text-current">
        <span className="text-default-600">Développé par</span>
        <img
          alt="Capt-IA"
          className="h-10 w-auto object-contain mt-[0.35rem]"
          src={logoSrc}
        />
      </div>
    </footer>
  );
};
