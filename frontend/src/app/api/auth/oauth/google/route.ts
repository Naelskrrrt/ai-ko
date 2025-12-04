import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export async function GET(_request: NextRequest) {
  try {
    // Appeler le backend Flask pour obtenir l'URL d'authentification Google
    const response = await fetch(`${BACKEND_URL}/api/auth/oauth/google`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Erreur lors de la connexion avec Google",
        error: error.message,
        backendUrl: BACKEND_URL,
        hint: "Vérifiez que le backend est accessible et que GOOGLE_CLIENT_ID est configuré",
      },
      { status: 500 },
    );
  }
}
