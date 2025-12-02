"use client";

import { useEffect, useRef, useCallback } from "react";

import { useAuth } from "@/core/providers/AuthProvider";
import {
  socketService,
  SocketNotification,
} from "@/shared/services/socket.service";

interface UseSocketOptions {
  onPendingUser?: (notification: SocketNotification) => void;
  onUserActivated?: (notification: SocketNotification) => void;
  onUserRejected?: (notification: SocketNotification) => void;
  onStatsUpdate?: () => void;
}

/**
 * Hook pour gérer la connexion WebSocket automatiquement
 * Se connecte/déconnecte selon l'état d'authentification de l'utilisateur
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { user } = useAuth();
  const { onPendingUser, onUserActivated, onUserRejected, onStatsUpdate } =
    options;

  // Utiliser useRef pour éviter les re-renders inutiles
  const callbacksRef = useRef(options);

  callbacksRef.current = options;

  // Fonction pour obtenir le token
  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;

    // Essayer d'abord les cookies
    let token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    // Si pas dans les cookies, essayer localStorage
    if (!token) {
      token = localStorage.getItem("auth_token") ?? undefined;
    }

    return token;
  }, []);

  // Connexion au WebSocket
  const connectSocket = useCallback(() => {
    if (!user?.id) return;

    const token = getToken();

    if (!token) {
      console.warn(
        "[useSocket] Aucun token trouvé pour la connexion WebSocket",
      );

      return;
    }

    console.log("[useSocket] Connexion WebSocket pour utilisateur:", user.id);
    socketService.connect(user.id, token);
  }, [user?.id, getToken]);

  // Configuration des écouteurs d'événements
  const setupListeners = useCallback(() => {
    if (callbacksRef.current.onPendingUser) {
      socketService.onPendingUser(callbacksRef.current.onPendingUser);
    }

    if (callbacksRef.current.onUserActivated) {
      socketService.onUserActivated(callbacksRef.current.onUserActivated);
    }

    if (callbacksRef.current.onUserRejected) {
      socketService.onUserRejected(callbacksRef.current.onUserRejected);
    }

    if (callbacksRef.current.onStatsUpdate) {
      socketService.onStatsUpdate(callbacksRef.current.onStatsUpdate);
    }
  }, []);

  // Connexion automatique quand l'utilisateur se connecte
  useEffect(() => {
    if (user?.id) {
      // Petit délai pour s'assurer que le token est bien stocké
      const timer = setTimeout(() => {
        connectSocket();
        setupListeners();
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // Déconnexion si l'utilisateur se déconnecte
      socketService.disconnect();
    }
  }, [user?.id, connectSocket, setupListeners]);

  // Cleanup à la destruction du composant
  useEffect(() => {
    return () => {
      // Ne pas déconnecter automatiquement ici, car d'autres composants peuvent utiliser le socket
      // La déconnexion sera gérée par le useEffect ci-dessus quand user devient null
    };
  }, []);

  return {
    isConnected: socketService.isConnected,
    socket: socketService.getSocket(),
    reconnect: connectSocket,
  };
}

export default useSocket;
