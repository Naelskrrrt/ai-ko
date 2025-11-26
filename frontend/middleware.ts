import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware Next.js - Protection des routes
 *
 * RÔLE : Vérifier la PRÉSENCE d'un token (amélioration UX)
 * ⚠️ La validation réelle du JWT se fait dans le BACKEND
 *
 * MODE DÉMO : Bypass complet
 * MODE PRODUCTION : Vérifie présence du token, redirige si absent
 */

// ================================================
// CONFIGURATION
// ================================================

/**
 * Routes publiques (pas de token requis)
 */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

/**
 * Routes protégées (token requis)
 * ⚠️ À personnaliser selon votre app
 */
const PROTECTED_ROUTES = ["/admin", "/etudiant", "/enseignant"];

/**
 * Routes désactivées (redirection automatique)
 * Ces routes ne sont pas accessibles pour l'instant
 */
const DISABLED_ROUTES = ["/dashboard", "/profile", "/settings", "/calendar"];

// ================================================
// HELPERS
// ================================================

function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isDisabledRoute(pathname: string): boolean {
  return DISABLED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

// ================================================
// MIDDLEWARE
// ================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier d'abord si c'est une route désactivée
  if (isDisabledRoute(pathname)) {
    // Rediriger vers la page d'accueil ou admin
    const token = request.cookies.get("auth_token")?.value;
    const redirectUrl = new URL(token ? "/admin" : "/", request.url);

    return NextResponse.redirect(redirectUrl);
  }

  // MODE DÉMO : Tout passe
  if (isDemoMode()) {
    return NextResponse.next();
  }

  // Routes publiques : Accès libre
  if (isPublicRoute(pathname)) {
    // Si l'utilisateur a un token et essaie d'accéder à /login ou /register, rediriger
    if (pathname === "/login" || pathname === "/register") {
      const token = request.cookies.get("auth_token")?.value;
      if (token) {
        // Rediriger vers /admin par défaut (ou la page d'accueil)
        const redirectUrl = new URL("/admin", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    }
    return NextResponse.next();
  }

  // Routes protégées : Vérifier présence du token
  if (isProtectedRoute(pathname)) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      // Pas de token → Redirect login avec URL de retour
      const loginUrl = new URL("/login", request.url);

      loginUrl.searchParams.set("redirect", pathname);

      return NextResponse.redirect(loginUrl);
    }

    // Token présent → Laisser passer
    // Le backend vérifiera sa validité sur les appels API
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Matcher pour toutes les routes sauf :
     * - API routes (/api/*)
     * - Fichiers statiques (_next/static, _next/image)
     * - Ressources publiques (favicon, images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

/**
 * DOCUMENTATION
 *
 * Ce middleware a DEUX rôles :
 * 1. Bloquer l'accès aux routes désactivées (DISABLED_ROUTES)
 * 2. Améliorer l'UX en redirigeant vers /login si pas de token
 *
 * IMPORTANT :
 * - Il ne valide PAS le JWT (c'est le job du backend)
 * - Il ne vérifie PAS les permissions (c'est le job du backend)
 * - Il vérifie juste la PRÉSENCE du cookie "auth_token"
 *
 * La vraie sécurité se passe dans :
 * - Le backend qui valide chaque JWT
 * - Les routes API qui transmettent le token au backend
 *
 * Pour modifier les routes :
 * - PROTECTED_ROUTES : Routes qui nécessitent un token
 * - DISABLED_ROUTES : Routes bloquées (redirection automatique)
 */
