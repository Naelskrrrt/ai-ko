/**
 * Service WebSocket pour les notifications temps réel
 */
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export interface SocketNotification {
  type: string;
  message: string;
  timestamp?: string;
  user_id?: string;
  user_data?: any;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 seconde
  private isConnecting = false;

  /**
   * Connexion au serveur WebSocket
   */
  connect(userId: string, token: string): Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return null;
    }

    this.isConnecting = true;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";

      this.socket = io(wsUrl, {
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      // Gestionnaire de connexion
      this.socket.on("connect", () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Rejoindre la room appropriée selon le rôle
        this.joinRooms(userId, token);
      });

      // Gestionnaire de déconnexion
      this.socket.on("disconnect", (reason) => {
        this.isConnecting = false;

        if (reason === "io server disconnect") {
          // Le serveur a forcé la déconnexion
          toast.error("Connexion perdue avec le serveur");
        }
      });

      // Gestionnaire d'erreur
      this.socket.on("connect_error", (_error) => {
        this.isConnecting = false;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
        } else {
          toast.error("Impossible de se connecter au serveur de notifications");
        }
      });

      // Gestionnaire d'erreur générale
      this.socket.on("error", (data) => {
        toast.error(data.message || "Erreur de connexion");
      });

      // Gestionnaire de connexion réussie
      this.socket.on("connected", (_data) => {
        // Connection confirmed
      });

      return this.socket;
    } catch (_error) {
      this.isConnecting = false;

      return null;
    }
  }

  /**
   * Rejoindre les rooms appropriées
   */
  private joinRooms(userId: string, token: string): void {
    if (!this.socket) return;

    // Essayer de déterminer le rôle depuis le token (basique)
    // En production, il faudrait décoder le token JWT côté client
    const isAdmin = token.includes("admin"); // Simplifié pour le prototype

    if (isAdmin) {
      // Admin rejoint la room des administrateurs
      this.socket.emit("join_admin_room", { token });
      this.socket.on("joined_admin_room", (_data) => {
        // Admin room joined
      });
    }

    // Tous les utilisateurs rejoignent leur room personnelle
    this.socket.emit("join_user_room", { token });
    this.socket.on("joined_user_room", (_data) => {
      // User room joined
    });
  }

  /**
   * Écouter les nouveaux utilisateurs en attente (pour les admins)
   */
  onPendingUser(callback: (notification: SocketNotification) => void): void {
    if (!this.socket) return;

    this.socket.on("pending_user", (notification: SocketNotification) => {
      // Afficher une notification toast
      toast.info(notification.message, {
        duration: 5000,
        action: {
          label: "Voir",
          onClick: () => {
            // Rediriger vers la page admin appropriée
            if (typeof window !== "undefined") {
              window.location.href = "/admin/pending-users";
            }
          },
        },
      });

      callback(notification);
    });
  }

  /**
   * Écouter l'activation du compte utilisateur
   */
  onUserActivated(callback: (notification: SocketNotification) => void): void {
    if (!this.socket) return;

    this.socket.on("account_activated", (notification: SocketNotification) => {
      // Afficher une notification toast de succès
      toast.success(notification.message, {
        duration: 10000,
        action: {
          label: "Se connecter",
          onClick: () => {
            // Rediriger vers la page de connexion
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
          },
        },
      });

      callback(notification);
    });
  }

  /**
   * Écouter le rejet du compte utilisateur
   */
  onUserRejected(callback: (notification: SocketNotification) => void): void {
    if (!this.socket) return;

    this.socket.on("account_rejected", (notification: SocketNotification) => {
      // Afficher une notification toast d'erreur
      toast.error(notification.message, {
        duration: 10000,
      });

      callback(notification);
    });
  }

  /**
   * Écouter les mises à jour de statistiques (pour les admins)
   */
  onStatsUpdate(callback: () => void): void {
    if (!this.socket) return;

    this.socket.on("stats_update", () => {
      callback();
    });
  }

  /**
   * Déconnexion du WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Vérifier si le socket est connecté
   */
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtenir l'instance du socket (pour debug)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Instance singleton
export const socketService = new SocketService();

export default socketService;
