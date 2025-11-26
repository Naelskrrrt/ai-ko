import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy API Universel - Route /api/[...path]
 *
 * RÔLE : Transmettre toutes les requêtes API vers le backend
 *
 * Fonctionnalités :
 * - Ajout automatique du token d'authentification
 * - Gestion automatique du refresh token en cas de 401
 * - Transmission des headers et cookies
 * - Support de tous les verbes HTTP
 *
 * MODE DÉMO : Retourne des données mockées
 * MODE PRODUCTION : Proxy vers le backend réel
 */

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  `http://localhost:${process.env.BACKEND_PORT || "8000"}`;

/**
 * Tente de refresh le token
 */
async function attemptTokenRefresh(
  request: NextRequest,
): Promise<string | null> {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) return null;

    const refreshResponse = await fetch(
      `${request.nextUrl.origin}/api/auth/refresh`,
      { method: "POST", credentials: "include" },
    );

    if (!refreshResponse.ok) return null;

    const data = await refreshResponse.json();

    return data.accessToken || null;
  } catch (error) {
    console.error("[API Proxy] Token refresh failed:", error);

    return null;
  }
}

/**
 * Fonction utilitaire pour proxifier les requêtes vers le backend
 */
async function proxyRequestWithCookies(
  method: string,
  path: string,
  body?: any,
  request?: NextRequest,
): Promise<NextResponse> {
  try {
    // ================================================
    // MODE DÉMO - Retour mocké
    // ================================================
    if (isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      return NextResponse.json({
        message: `Réponse mockée pour ${method} ${path}`,
        demo: true,
        data: [],
      });
    }

    // ================================================
    // MODE PRODUCTION - Proxy backend
    // ================================================

    const backendUrl = `${BACKEND_URL}${path}`;

    // Préparer les headers
    const backendHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Ajouter le token d'auth
    const token = request?.cookies.get("auth_token")?.value;

    if (token) {
      backendHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Copier le Content-Type si spécifié
    const contentType = request?.headers.get("content-type");

    if (contentType) {
      backendHeaders["Content-Type"] = contentType;
    }

    // Préparer la requête
    const fetchOptions: RequestInit = {
      method,
      headers: backendHeaders,
    };

    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      fetchOptions.body = body;
    }

    // Première tentative
    let response = await fetch(backendUrl, fetchOptions);

    // Si 401 (token expiré), tenter un refresh
    if (response.status === 401 && token && request) {
      console.log("[API Proxy] 401 detected, attempting token refresh...");

      const newToken = await attemptTokenRefresh(request);

      if (newToken) {
        console.log("[API Proxy] Token refreshed, retrying request...");

        // Retry avec le nouveau token
        backendHeaders["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(backendUrl, fetchOptions);
      }
    }

    // Parser la réponse
    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log(
      `[API Proxy] Response ${response.status} for ${method} ${path}`,
    );

    // Retourner la réponse
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error(`[API Proxy] Error for ${method} ${path}:`, error);

    return NextResponse.json(
      {
        error: "Backend connection error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

/**
 * Handler pour les requêtes GET
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParts } = await context.params;
  // Construire le chemin avec /api au début
  const path = `/api/${pathParts.join("/")}`;
  const searchParams = request.nextUrl.searchParams.toString();
  const fullPath = searchParams ? `${path}?${searchParams}` : path;

  return proxyRequestWithCookies("GET", fullPath, undefined, request);
}

/**
 * Handler pour les requêtes POST
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParts } = await context.params;
  // Construire le chemin avec /api au début
  const path = `/api/${pathParts.join("/")}`;

  // Gestion spéciale pour les fichiers uploadés
  const contentType = request.headers.get("content-type") || "";
  let body;

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/octet-stream")
  ) {
    // Pour les fichiers binaires
    body = await request.arrayBuffer();
  } else {
    // Pour les données texte/JSON
    body = await request.text();
  }

  return proxyRequestWithCookies("POST", path, body, request);
}

/**
 * Handler pour les requêtes PUT
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParts } = await context.params;
  // Construire le chemin avec /api au début
  const path = `/api/${pathParts.join("/")}`;
  const body = await request.text();

  return proxyRequestWithCookies("PUT", path, body, request);
}

/**
 * Handler pour les requêtes DELETE
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParts } = await context.params;
  // Construire le chemin avec /api au début
  const path = `/api/${pathParts.join("/")}`;

  return proxyRequestWithCookies("DELETE", path, undefined, request);
}

/**
 * Handler pour les requêtes PATCH
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathParts } = await context.params;
  // Construire le chemin avec /api au début
  const path = `/api/${pathParts.join("/")}`;
  const body = await request.text();

  return proxyRequestWithCookies("PATCH", path, body, request);
}

/**
 * Handler pour les requêtes OPTIONS (CORS preflight)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
