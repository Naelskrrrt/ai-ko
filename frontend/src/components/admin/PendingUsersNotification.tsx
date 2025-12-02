"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Bell } from "lucide-react";

import { useSocket } from "@/core/hooks/useSocket";
import { adminService } from "@/shared/services/api/admin.service";

export function PendingUsersNotification() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(false);

  // Charger le nombre initial d'utilisateurs en attente
  const loadPendingCount = async () => {
    try {
      const response = await adminService.getPendingUsers();

      setPendingCount(response.total);
    } catch (error) {
      // Erreur lors du chargement du compteur
    }
  };

  // Configuration du WebSocket pour recevoir les notifications
  useSocket({
    onPendingUser: () => {
      // Incrémenter le compteur
      setPendingCount((prev) => prev + 1);

      // Afficher le badge de notification
      setShowBadge(true);

      // Masquer automatiquement le badge après 10 secondes
      setTimeout(() => setShowBadge(false), 10000);
    },
  });

  // Effet pour charger le compteur initial
  useEffect(() => {
    loadPendingCount();
  }, []);

  // Gestionnaire de clic sur la cloche
  const handleNotificationClick = () => {
    // Masquer le badge
    setShowBadge(false);

    // Rediriger vers la page des utilisateurs en attente
    if (typeof window !== "undefined") {
      window.location.href = "/admin/pending-users";
    }
  };

  // Si pas d'utilisateurs en attente, ne rien afficher
  if (pendingCount === 0) {
    return (
      <Button
        isIconOnly
        className="relative"
        size="sm"
        variant="light"
        onClick={() => (window.location.href = "/admin/pending-users")}
      >
        <Bell className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        isIconOnly
        className="relative"
        size="sm"
        variant="light"
        onClick={handleNotificationClick}
      >
        <Bell className="w-5 h-5" />
        {pendingCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 animate-pulse"
            color="danger"
            showOutline={false}
            size="sm"
          >
            {pendingCount > 99 ? "99+" : pendingCount}
          </Badge>
        )}
      </Button>

      {/* Indicateur visuel supplémentaire si showBadge est true */}
      {showBadge && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full animate-ping opacity-75" />
      )}

      {/* Tooltip informatif */}
      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-default-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {pendingCount === 1
            ? "1 utilisateur en attente"
            : `${pendingCount} utilisateurs en attente`}
        </div>
      </div>
    </div>
  );
}

export default PendingUsersNotification;
