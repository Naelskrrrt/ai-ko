import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export async function GET() {
  const tests = [];

  // Test 1: Health endpoint
  try {
    const healthStart = Date.now();
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const healthDuration = Date.now() - healthStart;
    const healthData = await healthResponse.json();

    tests.push({
      name: "Health Check",
      url: `${BACKEND_URL}/api/health`,
      status: healthResponse.status,
      success: healthResponse.ok,
      duration: `${healthDuration}ms`,
      response: healthData,
    });
  } catch (error: any) {
    tests.push({
      name: "Health Check",
      url: `${BACKEND_URL}/api/health`,
      status: 0,
      success: false,
      error: error.message,
    });
  }

  // Test 2: OAuth Google endpoint
  try {
    const oauthStart = Date.now();
    const oauthResponse = await fetch(
      `${BACKEND_URL}/api/auth/oauth/google`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const oauthDuration = Date.now() - oauthStart;
    const oauthData = await oauthResponse.json();

    tests.push({
      name: "OAuth Google",
      url: `${BACKEND_URL}/api/auth/oauth/google`,
      status: oauthResponse.status,
      success: oauthResponse.ok,
      duration: `${oauthDuration}ms`,
      response: oauthData,
    });
  } catch (error: any) {
    tests.push({
      name: "OAuth Google",
      url: `${BACKEND_URL}/api/auth/oauth/google`,
      status: 0,
      success: false,
      error: error.message,
    });
  }

  const allSuccess = tests.every((test) => test.success);

  return NextResponse.json(
    {
      backendUrl: BACKEND_URL,
      timestamp: new Date().toISOString(),
      environment: {
        BACKEND_INTERNAL_URL: process.env.BACKEND_INTERNAL_URL || "not set",
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "not set",
      },
      allTestsPassed: allSuccess,
      tests,
    },
    {
      status: allSuccess ? 200 : 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}



