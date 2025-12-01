import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/session
 *
 * Vérifie la session utilisateur et retourne les informations
 *
 * RÔLE : Vérifier si l'utilisateur est authentifié
 *
 * MODE DÉMO : Retourne toujours un utilisateur mocké
 * MODE PRODUCTION : 🔗 Vérifie le token auprès du backend
 */

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value;

    // ================================================
    // MODE DÉMO - Toujours authentifié
    // ================================================
    if (isDemoMode) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: "user_123",
          username: "demo_user",
          email: "demo@example.com",
          firstName: "Demo",
          lastName: "User",
          role: "admin",
        },
      });
    }

    // ================================================
    // MODE PRODUCTION - Vérification backend
    // ================================================

    if (!token) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "No token provided",
        },
        { status: 401 },
      );
    }

    /*
     * 🔗 INTÉGRATION BACKEND
     *
     * Vérifier le token auprès du backend
     */

    const backendResponse = await fetch(`${BACKEND_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          authenticated: false,
          message: "Invalid token",
        },
        { status: 401 },
      );
    }

    const userData = await backendResponse.json();

    return NextResponse.json({
      authenticated: true,
      user: userData,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Session check error:", error);

    return NextResponse.json(
      {
        authenticated: false,
        error: "Session check failed",
      },
      { status: 500 },
    );
  }
}

/**
 * 📚 EXEMPLE D'INTÉGRATION BACKEND
 *
 * FastAPI :
 * ```python
 * @router.get("/auth/me")
 * async def get_current_user(current_user: User = Depends(get_current_user)):
 *     return current_user.dict()
 *
 * # Dépendance pour vérifier le JWT
 * async def get_current_user(token: str = Depends(oauth2_scheme)):
 *     try:
 *         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
 *         user_id = payload.get("sub")
 *         user = await get_user_by_id(user_id)
 *         if not user:
 *             raise HTTPException(401, "User not found")
 *         return user
 *     except JWTError:
 *         raise HTTPException(401, "Invalid token")
 * ```
 *
 * Django :
 * ```python
 * @api_view(['GET'])
 * @permission_classes([IsAuthenticated])
 * def current_user(request):
 *     return Response(UserSerializer(request.user).data)
 * ```
 *
 * Express :
 * ```javascript
 * app.get('/auth/me', authenticateToken, (req, res) => {
 *   res.json(req.user);
 * });
 *
 * // Middleware d'authentification
 * function authenticateToken(req, res, next) {
 *   const authHeader = req.headers['authorization'];
 *   const token = authHeader && authHeader.split(' ')[1];
 *
 *   if (!token) return res.sendStatus(401);
 *
 *   jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
 *     if (err) return res.sendStatus(403);
 *     req.user = user;
 *     next();
 *   });
 * }
 * ```
 */
