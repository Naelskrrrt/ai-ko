import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware Next.js - Protection des routes et redirection par rôle
 *
 * LOGIQUE SIMPLE :
 * - INSCRIPTION → Onboarding (pour choisir le rôle)
 * - CONNEXION → Dashboard directement (si l'utilisateur a un rôle)
 *
 * ⚠️ La validation réelle du JWT se fait dans le BACKEND
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
 * Routes d'onboarding (réservées aux nouvelles inscriptions)
 */
const ONBOARDING_ROUTES = [
  "/onboarding/role-selection",
  "/onboarding/profile-details",
  "/onboarding/select-matieres",
  "/onboarding/confirmation",
];

/**
 * Routes protégées (token requis)
 */
const PROTECTED_ROUTES = ["/admin", "/etudiant", "/enseignant"];

/**
 * Routes désactivées (redirection automatique)
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

function isOnboardingRoute(pathname: string): boolean {
  return ONBOARDING_ROUTES.some((route) => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isDisabledRoute(pathname: string): boolean {
  return DISABLED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getDashboardByRole(role: string): string {
  switch (role) {
    case "etudiant":
      return "/etudiant";
    case "enseignant":
      return "/enseignant";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}

interface UserData {
  role?: string;
  etudiantProfil?: any;
  enseignantProfil?: any;
}

interface AuthMeResponse {
  user: UserData;
  onboardingComplete?: boolean;
  requiresOnboarding?: boolean;
}

async function fetchUserData(token: string): Promise<AuthMeResponse | null> {
  try {
    const apiUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000";

    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `auth_token=${token}`,
      },
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
    return null;
  } catch (error) {
    console.error("[Middleware] Erreur fetch user data:", error);
    return null;
  }
}

// ================================================
// MIDDLEWARE
// ================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Vérifier d'abord si c'est une route désactivée
  if (isDisabledRoute(pathname)) {
    const redirectUrl = new URL(token ? "/admin" : "/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // MODE DÉMO : Tout passe
  if (isDemoMode()) {
    return NextResponse.next();
  }

  // Routes publiques : Accès libre
  if (isPublicRoute(pathname)) {
    // Si l'utilisateur a un token et essaie d'accéder à /login ou /register
    if (pathname === "/login" || pathname === "/register") {
      if (token) {
        const authData = await fetchUserData(token);
        if (authData && authData.user?.role) {
          // L'utilisateur a un rôle → rediriger vers son dashboard
          const dashboardPath = getDashboardByRole(authData.user.role);
          return NextResponse.redirect(new URL(dashboardPath, request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Routes d'onboarding : Réservées aux nouvelles inscriptions
  if (isOnboardingRoute(pathname)) {
    if (!token) {
      // Pas de token → rediriger vers login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Token présent, vérifier si l'utilisateur a déjà un rôle
    const authData = await fetchUserData(token);
    if (authData && authData.user?.role) {
      // L'utilisateur a déjà un rôle → rediriger vers son dashboard
      const dashboardPath = getDashboardByRole(authData.user.role);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    
    // Pas de rôle → laisser continuer l'onboarding (nouvelle inscription)
    return NextResponse.next();
  }

  // Routes protégées : Vérifier présence du token et rôle
  if (isProtectedRoute(pathname)) {
    if (!token) {
      // Pas de token → Redirect login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Token présent, vérifier le rôle
    const authData = await fetchUserData(token);
    
    if (!authData) {
      // Token invalide → rediriger vers login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const userRole = authData.user?.role;
    
    if (!userRole) {
      // Pas de rôle (ne devrait pas arriver si l'utilisateur est déjà inscrit)
      // Rediriger vers login pour éviter les boucles
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Vérifier que l'utilisateur accède au bon dashboard
    const expectedDashboard = getDashboardByRole(userRole);
    
    if (!pathname.startsWith(expectedDashboard)) {
      return NextResponse.redirect(new URL(expectedDashboard, request.url));
    }

    // Tout est OK
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

/**
 * DOCUMENTATION
 *
 * LOGIQUE SIMPLIFIÉE :
 * 
 * 1. INSCRIPTION (register) → Après inscription, l'utilisateur est redirigé
 *    vers l'onboarding pour choisir son rôle (etudiant/enseignant)
 * 
 * 2. CONNEXION (login) → L'utilisateur est redirigé directement vers son
 *    dashboard selon son rôle (pas d'onboarding)
 * 
 * 3. ONBOARDING → Accessible uniquement aux utilisateurs sans rôle
 *    (nouvelles inscriptions). Si l'utilisateur a déjà un rôle, il est
 *    redirigé vers son dashboard.
 * 
 * 4. DASHBOARD → Si des informations manquent dans le profil, un modal
 *    s'affiche pour compléter (pas de redirection vers onboarding)
 */
