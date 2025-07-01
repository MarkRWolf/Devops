// client/app/api/account/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const DOTNET_INTERNAL_API_BASE_URL = process.env.DOTNET_API_BASE_URL;

// Add a startup log to confirm the env var is read
console.log(`[ROUTE.TS STARTUP] DOTNET_API_BASE_URL: ${DOTNET_INTERNAL_API_BASE_URL}`);

if (!DOTNET_INTERNAL_API_BASE_URL) {
  console.error("ERROR: DOTNET_API_BASE_URL environment variable is not set!");
}

async function proxyRequest(request: NextRequest) {
  // Add a log for every request received by this route
  console.log(
    `[ROUTE.TS REQUEST] Method: ${request.method}, Pathname: ${request.nextUrl.pathname}`
  ); // Log the constructed backend path (BEFORE it's used to construct the final URL)
  const pathSegments = request.nextUrl.pathname.split("/api/"); // <--- CHANGED THIS LINE
  const backendPath = pathSegments.length > 1 ? pathSegments[1] : ""; // Renamed 'path' to 'backendPath' for clarity

  console.log(
    `[ROUTE.TS REQUEST] Backend Path Segment: ${backendPath}` // <--- NEW LOG
  );

  let requestBody: BodyInit | null = null;
  const queryStringToForward = "";

  const headers = new Headers();
  if (request.headers.get("cookie")) {
    headers.set("cookie", request.headers.get("cookie")!);
  }
  if (request.headers.get("content-type")) {
    headers.set("content-type", request.headers.get("content-type")!);
  }

  if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
    try {
      requestBody = await request.text();
      console.log(
        `[ROUTE.TS BODY] Received body for ${request.method}: ${requestBody.slice(0, 100)}...`
      );
    } catch (e: unknown) {
      let errorMessage = "Invalid request body.";
      if (e instanceof Error) {
        errorMessage += ` Details: ${e.message}`;
      } else {
        errorMessage += ` Details: ${String(e)}`;
      }
      console.error("[ROUTE.TS ERROR] Error parsing request body:", e);
      return new NextResponse(errorMessage, { status: 400 });
    }
  }

  if (request.nextUrl.search) {
    console.warn(
      `[ROUTE.TS WARN] Unexpected query parameters for ${backendPath} discarded: ${request.nextUrl.search}`
    );
  }

  if (!DOTNET_INTERNAL_API_BASE_URL) {
    console.error("[ROUTE.TS ERROR] DOTNET_API_BASE_URL is undefined, cannot proxy request.");
    return new NextResponse("Server configuration error: Missing API URL.", { status: 500 });
  } // CONSTRUCT THE CORRECT URL FOR THE .NET BACKEND

  const url = new URL(`${DOTNET_INTERNAL_API_BASE_URL}/${backendPath}${queryStringToForward}`); // <--- CHANGED THIS LINE
  console.log(`[ROUTE.TS FETCH] Attempting to fetch: ${url.toString()}`); // This is the new log you requested

  try {
    const response = await fetch(url, {
      method: request.method,
      headers: headers,
      body: requestBody,
      cache: "no-store",
    });

    console.log(`[ROUTE.TS RESPONSE] Backend responded with status: ${response.status}`);

    const responseHeaders = new Headers(response.headers);
    if (response.headers.has("set-cookie")) {
      responseHeaders.set("set-cookie", response.headers.get("set-cookie")!);
    }
    responseHeaders.delete("x-powered-by");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (e: unknown) {
    let errorMessage = "An internal server error occurred.";
    let consoleErrorMessage = "";
    if (e instanceof Error) {
      errorMessage = e.message;
      consoleErrorMessage = e.message;
    } else {
      consoleErrorMessage = String(e);
    }
    console.error(`[ROUTE.TS CATCH] Proxy error (${request.method} ${url}):`, consoleErrorMessage);
    return new NextResponse(`Proxy error: ${errorMessage}`, { status: 500 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
