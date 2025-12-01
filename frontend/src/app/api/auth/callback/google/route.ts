import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Côté serveur, utiliser BACKEND_INTERNAL_URL pour se connecter au backend local
const API_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url),
    );
  }

  try {
    // Envoyer le code au backend Flask
    const response = await axios.post(
      `${API_URL}/api/auth/oauth/google/callback`,
      { code },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      },
    );

    const { user, token } = response.data;

    // Déterminer la redirection selon le rôle de l'utilisateur
    let redirectPath = "/dashboard";

    if (user?.role === "admin") {
      redirectPath = "/admin";
    } else if (user?.role === "etudiant") {
      redirectPath = "/etudiant";
    } else if (user?.role === "enseignant") {
      redirectPath = "/enseignant";
    }

    // Stocker le token dans un cookie sécurisé
    const redirectResponse = NextResponse.redirect(
      new URL(redirectPath, request.url),
    );

    // Stocker le token dans un cookie httpOnly
    redirectResponse.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: "/",
    });

    return redirectResponse;
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Google OAuth error:", error);

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          error.response?.data?.message || "Erreur lors de la connexion Google",
        )}`,
        request.url,
      ),
    );
  }
}
