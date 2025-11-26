import type { RefreshTokenResponse } from "@/core/types/auth";

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/refresh
 *
 * Rafraîchit le token d'accès à l'aide du refresh token
 *
 * RÔLE : Obtenir un nouveau token d'accès sans redemander les credentials
 *
 * MODE DÉMO : Retourne un nouveau token mocké
 * MODE PRODUCTION : 🔗 Appelle le backend pour obtenir un nouveau token
 */

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_REFRESH_TOKEN",
          message: "Aucun refresh token disponible",
        },
        { status: 401 },
      );
    }

    // ================================================
    // MODE DÉMO - Nouveau token mocké
    // ================================================
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newAccessToken = "mock_access_token_" + Date.now();
      const response = NextResponse.json<RefreshTokenResponse>({
        accessToken: newAccessToken,
        expiresIn: 900, // 15 minutes
      });

      // Mettre à jour le cookie
      response.cookies.set("auth_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 900,
        path: "/",
      });

      return response;
    }

    // ================================================
    // MODE PRODUCTION - Appel backend
    // ================================================

    /*
     * 🔗 INTÉGRATION BACKEND
     *
     * Envoyer le refresh token au backend pour obtenir un nouveau access token
     */

    const backendResponse = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Refresh token invalide ou expiré
      const response = NextResponse.json(data, {
        status: backendResponse.status,
      });

      // Nettoyer les cookies
      response.cookies.delete("auth_token");
      response.cookies.delete("refresh_token");

      return response;
    }

    // Mettre à jour le cookie avec le nouveau token
    const response = NextResponse.json(data);

    if (data.accessToken) {
      response.cookies.set("auth_token", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.expiresIn || 900,
        path: "/",
      });
    }

    // Optionnel : Rotation du refresh token
    if (data.refreshToken) {
      response.cookies.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 604800, // 7 jours
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);

    const response = NextResponse.json(
      {
        success: false,
        error: "REFRESH_FAILED",
        message: "Échec du rafraîchissement du token",
      },
      { status: 500 },
    );

    // Nettoyer les cookies en cas d'erreur
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
 * @router.post("/auth/refresh")
 * async def refresh_token(refresh_token: str):
 *     # Vérifier le refresh token
 *     payload = verify_refresh_token(refresh_token)
 *     if not payload:
 *         raise HTTPException(401, "Invalid refresh token")
 *
 *     # Récupérer l'utilisateur
 *     user = await get_user(payload['sub'])
 *     if not user:
 *         raise HTTPException(404, "User not found")
 *
 *     # Générer un nouveau access token
 *     new_access_token = create_access_token(user)
 *
 *     # Optionnel : Générer un nouveau refresh token (rotation)
 *     new_refresh_token = create_refresh_token(user)
 *
 *     return {
 *         "accessToken": new_access_token,
 *         "refreshToken": new_refresh_token,  # Optionnel
 *         "expiresIn": 900
 *     }
 * ```
 *
 * Django (avec djangorestframework-simplejwt) :
 * ```python
 * @api_view(['POST'])
 * def refresh_token(request):
 *     refresh = request.data.get('refreshToken')
 *
 *     try:
 *         refresh_token = RefreshToken(refresh)
 *         access_token = str(refresh_token.access_token)
 *
 *         return Response({
 *             "accessToken": access_token,
 *             "expiresIn": 900
 *         })
 *     except TokenError:
 *         return Response(
 *             {"error": "Invalid refresh token"},
 *             status=401
 *         )
 * ```
 *
 * Express (avec jsonwebtoken) :
 * ```javascript
 * app.post('/auth/refresh', async (req, res) => {
 *   const { refreshToken } = req.body;
 *
 *   try {
 *     // Vérifier le refresh token
 *     const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
 *
 *     // Générer un nouveau access token
 *     const newAccessToken = jwt.sign(
 *       { userId: payload.userId, role: payload.role },
 *       ACCESS_TOKEN_SECRET,
 *       { expiresIn: '15m' }
 *     );
 *
 *     res.json({
 *       accessToken: newAccessToken,
 *       expiresIn: 900
 *     });
 *   } catch (error) {
 *     res.status(401).json({ error: 'Invalid refresh token' });
 *   }
 * });
 * ```
 */
