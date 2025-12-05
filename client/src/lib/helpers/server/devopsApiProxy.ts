// client/src/lib/helpers/server/devopsApiProxy.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

function copyHeaders(src: Headers, extra: Record<string, string> = {}) {
  const out = new Headers();
  src.forEach((v, k) => {
    const lower = k.toLowerCase();
    if (["host", "connection"].includes(lower)) return;
    out.set(k, v);
  });
  Object.entries(extra).forEach(([k, v]) => out.set(k, v));
  return out;
}

type ProxyOptions = {
  extraHeaders?: Record<string, string>;
  requireAuth?: boolean;
};

export function createDevopsApiProxy(options?: ProxyOptions) {
  return async function handler(req: NextRequest) {
    const backend = process.env.DOTNET_API_BASE_URL + "/API";
    if (!backend) throw new Error("DOTNET_API_BASE_URL is not set");

    const path = req.nextUrl.pathname.replace(/^\/api\//, "");
    const url = `${backend}/${path}${req.nextUrl.search}`;

    const extraHeaders: Record<string, string> = {
      ...(options?.extraHeaders ?? {}),
    };

    if (options?.requireAuth) {
      const session = await getServerSession(authOptions);
      if (!session?.accessToken) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      extraHeaders["Authorization"] = `Bearer ${session.accessToken}`;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: req.method,
        headers: copyHeaders(req.headers, extraHeaders),
        cache: "no-store",
        redirect: "manual",
        ...(!["GET", "HEAD"].includes(req.method) && {
          body: req.body,
          duplex: "half" as const,
        }),
      });
    } catch (err) {
      console.log("Internal server error:", err);
      return new NextResponse("Internal server error", { status: 500 });
    }

    const outHeaders = copyHeaders(res.headers);

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: outHeaders,
    });
  };
}

