import type { LogoutResponse } from "@/core/types/auth";

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Déconnecte l'utilisateur et invalide les tokens
 *
 * RÔLE : Nettoyer les cookies + notifier le backend
 *
 * MODE DÉMO : Simule la déconnexion
 * MODE PRODUCTION : 🔗 Appelle le backend pour invalider les tokens
 */

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    // ================================================
    // MODE DÉMO - Simulation
    // ================================================
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = NextResponse.json<LogoutResponse>({
        success: true,
        message: "Déconnexion réussie",
      });

      // Supprimer les cookies
      response.cookies.delete("auth_token");
      response.cookies.delete("refresh_token");

      return response;
    }

    // ================================================
    // MODE PRODUCTION - Appel backend
    // ================================================

    const token = request.cookies.get("auth_token")?.value;

    /*
     * 🔗 INTÉGRATION BACKEND
     *
     * Notifier le backend pour invalider les tokens côté serveur
     * (blacklist, suppression du refresh token en DB, etc.)
     */

    if (token) {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      // Ignorer les erreurs - on nettoie localement de toute façon
    }

    const response = NextResponse.json<LogoutResponse>({
      success: true,
      message: "Déconnexion réussie",
    });

    // Supprimer les cookies
    response.cookies.delete("auth_token");
    response.cookies.delete("refresh_token");

    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Logout error:", error);

    // Même en cas d'erreur, on nettoie les cookies
    const response = NextResponse.json<LogoutResponse>({
      success: true,
      message: "Déconnexion effectuée",
    });

    response.cookies.delete("auth_token");
    response.cookies.delete("refresh_token");

    return response;
  }
}

/**
 * 📚 EXEMPLE D'INTÉGRATION BACKEND
 *
 * FastAPI :
 * ```python
 * @router.post("/auth/logout")
 * async def logout(token: str = Depends(get_current_token)):
 *     # Ajouter le token à la blacklist
 *     await redis_client.setex(
 *         f"blacklist:{token}",
 *         3600,  # Durée de vie du token
 *         "1"
 *     )
 *     return {"success": True, "message": "Logged out"}
 * ```
 *
 * Django :
 * ```python
 * @api_view(['POST'])
 * @permission_classes([IsAuthenticated])
 * def logout(request):
 *     # Supprimer le refresh token de la DB
 *     request.user.auth_token.delete()
 *     return Response({"success": True})
 * ```
 */
