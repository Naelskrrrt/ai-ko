import type { LoginCredentials, LoginResponse } from "@/core/types/auth";

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/login
 *
 * Authentifie un utilisateur et retourne des tokens JWT
 *
 * RÔLE : Proxy vers le backend + gestion des cookies sécurisés
 *
 * MODE DÉMO : Retourne des données mockées
 * MODE PRODUCTION : 🔗 Transmet la requête au backend
 */

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { username, password, rememberMe } = body;

    // Validation basique
    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          message: "Nom d'utilisateur et mot de passe requis",
        },
        { status: 400 },
      );
    }

    // ================================================
    // MODE DÉMO - Retour mocké
    // ================================================
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Simulation d'erreur pour tester
      if (password === "wrong") {
        return NextResponse.json(
          {
            success: false,
            error: "INVALID_CREDENTIALS",
            message: "Identifiants incorrects",
          },
          { status: 401 },
        );
      }

      const mockResponse: LoginResponse = {
        success: true,
        user: {
          id: "user_123",
          username,
          email: `${username}@example.com`,
          firstName: "Demo",
          lastName: "User",
          role: username === "admin" ? "admin" : "user",
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: "mock_access_token_" + Date.now(),
          refreshToken: "mock_refresh_token_" + Date.now(),
          tokenType: "Bearer",
          expiresIn: rememberMe ? 604800 : 900,
        },
        message: "Connexion réussie",
      };

      const response = NextResponse.json(mockResponse);

      // Définir les cookies
      response.cookies.set("auth_token", mockResponse.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: mockResponse.tokens.expiresIn,
        path: "/",
      });

      return response;
    }

    // ================================================
    // MODE PRODUCTION - Appel backend réel
    // ================================================

    /*
     * 🔗 INTÉGRATION BACKEND
     *
     * Décommentez et adaptez selon votre backend :
     */

    const backendResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, rememberMe }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // Créer la réponse avec cookies sécurisés
    const response = NextResponse.json(data);

    if (data.tokens?.accessToken) {
      response.cookies.set("auth_token", data.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: data.tokens.expiresIn || 900,
        path: "/",
      });
    }

    if (data.tokens?.refreshToken) {
      response.cookies.set("refresh_token", data.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 604800, // 7 jours
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Erreur interne du serveur",
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS - CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * 📚 EXEMPLE D'INTÉGRATION BACKEND
 *
 * FastAPI :
 * ```python
 * @router.post("/auth/login")
 * async def login(credentials: LoginCredentials):
 *     user = await authenticate_user(credentials.username, credentials.password)
 *     if not user:
 *         raise HTTPException(401, "Invalid credentials")
 *
 *     access_token = create_access_token(user)
 *     refresh_token = create_refresh_token(user)
 *
 *     return {
 *         "success": True,
 *         "user": user.dict(),
 *         "tokens": {
 *             "accessToken": access_token,
 *             "refreshToken": refresh_token,
 *             "tokenType": "Bearer",
 *             "expiresIn": 900
 *         }
 *     }
 * ```
 *
 * Django :
 * ```python
 * @api_view(['POST'])
 * def login(request):
 *     username = request.data.get('username')
 *     password = request.data.get('password')
 *
 *     user = authenticate(username=username, password=password)
 *     if not user:
 *         return Response({"error": "Invalid credentials"}, status=401)
 *
 *     refresh = RefreshToken.for_user(user)
 *
 *     return Response({
 *         "success": True,
 *         "user": UserSerializer(user).data,
 *         "tokens": {
 *             "accessToken": str(refresh.access_token),
 *             "refreshToken": str(refresh),
 *             "tokenType": "Bearer",
 *             "expiresIn": 900
 *         }
 *     })
 * ```
 */
