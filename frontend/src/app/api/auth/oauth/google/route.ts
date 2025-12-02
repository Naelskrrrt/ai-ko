import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    console.log("[OAuth Proxy] Calling backend:", `${BACKEND_URL}/api/auth/oauth/google`);
    
    // Appeler le backend Flask pour obtenir l'URL d'authentification Google
    const response = await fetch(`${BACKEND_URL}/api/auth/oauth/google`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("[OAuth Proxy] Backend response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[OAuth Proxy] Backend error:", errorText);
      throw new Error(`Backend returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[OAuth Proxy] Backend data:", data);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("[OAuth Proxy] Error:", error);
    
    return NextResponse.json(
      {
        message: "Erreur lors de la connexion avec Google",
        error: error.message,
        backendUrl: BACKEND_URL,
        hint: "Vérifiez que le backend est accessible et que GOOGLE_CLIENT_ID est configuré",
      },
      { status: 500 }
    );
  }
}

