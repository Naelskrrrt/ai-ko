import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pages publiques (pas de vérification)
  const publicPaths = ["/login", "/register", "/"];
  const onboardingPaths = [
    "/onboarding/role-selection",
    "/onboarding/profile-details",
    "/onboarding/select-matieres",
    "/onboarding/confirmation",
  ];

  // Si c'est une page publique, laisser passer
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Récupérer le token depuis les cookies
  const token =
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("access_token_cookie")?.value;

  if (!token) {
    // Pas de token -> rediriger vers login si ce n'est pas une page publique ou d'onboarding
    if (!onboardingPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Si c'est une page d'onboarding, laisser passer (l'utilisateur peut être en train de s'inscrire)
    return NextResponse.next();
  }

  // Vérifier le statut d'onboarding avec le backend
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
      const user = data.user;

      // Debug: Afficher les données reçues
      console.log("[Middleware] User data:", {
        role: user?.role,
        hasEtudiantProfil: !!user?.etudiantProfil,
        hasEnseignantProfil: !!user?.enseignantProfil,
        etudiantProfilKeys: user?.etudiantProfil
          ? Object.keys(user.etudiantProfil)
          : [],
        enseignantProfilKeys: user?.enseignantProfil
          ? Object.keys(user.enseignantProfil)
          : [],
      });

      // Vérifier si l'onboarding est complet
      const hasProfile = user?.etudiantProfil || user?.enseignantProfil;

      // Si l'utilisateur n'a PAS de profil complet
      if (!hasProfile) {
        // Si l'utilisateur n'est PAS déjà sur une page d'onboarding
        if (!onboardingPaths.some((path) => pathname.startsWith(path))) {
          // FORCER la redirection vers l'onboarding
          return NextResponse.redirect(
            new URL("/onboarding/role-selection", request.url),
          );
        }

        // Sinon, l'utilisateur est déjà sur l'onboarding, laisser continuer
        return NextResponse.next();
      }

      // L'utilisateur a un profil complet
      // S'il essaie d'accéder à l'onboarding, le rediriger vers son dashboard
      if (onboardingPaths.some((path) => pathname.startsWith(path))) {
        const dashboardPath =
          user.role === "etudiant"
            ? "/etudiant"
            : user.role === "enseignant"
              ? "/enseignant"
              : "/admin";

        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }

      // Tout est OK, laisser passer
      return NextResponse.next();
    } else {
      // Token invalide -> rediriger vers login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (error) {
    console.error("Erreur middleware:", error);

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
