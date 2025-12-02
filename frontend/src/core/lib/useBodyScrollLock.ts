"use client";

import { useEffect } from "react";

/**
 * Hook pour bloquer le scroll du body quand un modal est ouvert
 * @param isLocked - État pour déterminer si le scroll doit être bloqué
 */
export const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (isLocked) {
      // Sauvegarder la position de scroll actuelle
      const scrollY = window.scrollY;

      // Bloquer le scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      // Cleanup function pour restaurer le scroll
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";

        // Restaurer la position de scroll
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
};
