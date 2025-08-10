// client/app/api/health/route.ts
import { NextRequest, NextResponse } from "next/server";

const DOTNET_INTERNAL_API_BASE_URL = process.env.DOTNET_API_BASE_URL;

async function proxyHealthRequest(request: NextRequest) {
  console.log(
    `[HEALTH ROUTE.TS REQUEST] Method: ${request.method}, Pathname: ${request.nextUrl.pathname}`
  );

  if (!DOTNET_INTERNAL_API_BASE_URL) {
    console.error(
      "[HEALTH ROUTE.TS ERROR] DOTNET_API_BASE_URL is undefined, cannot proxy health request."
    );
    return new NextResponse("Server configuration error: Missing API URL.", { status: 500 });
  }

  const url = new URL(`${DOTNET_INTERNAL_API_BASE_URL}/health`);

  console.log(`[HEALTH ROUTE.TS FETCH] Attempting to fetch health from: ${url.toString()}`);

  try {
    const response = await fetch(url, {
      method: request.method,
      cache: "no-store",
    });

    console.log(
      `[HEALTH ROUTE.TS RESPONSE] Backend health responded with status: ${response.status}`
    );

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
  } catch (e: unknown) {
    let errorMessage = "Health check proxy error.";
    if (e instanceof Error) {
      errorMessage += ` Details: ${e.message}`;
    } else {
      errorMessage += ` Details: ${String(e)}`;
    }
    console.error(`[HEALTH ROUTE.TS CATCH] Health proxy error (${request.method} ${url}):`, e);
    return new NextResponse(`Health check proxy error: ${errorMessage}`, { status: 500 });
  }
}

export const GET = proxyHealthRequest;
