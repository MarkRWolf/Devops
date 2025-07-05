import { NextRequest, NextResponse } from "next/server";

function copyHeaders(h: Headers, extra: Record<string, string> = {}) {
  const out = new Headers(h);
  Object.entries(extra).forEach(([k, v]) => out.set(k, v));
  out.delete("x-powered-by");
  return out;
}

export function makeDotnetProxy() {
  return async function handler(req: NextRequest) {
    const backend = process.env.DOTNET_API_BASE_URL;
    if (!backend) throw new Error("DOTNET_API_BASE_URL is not set");

    const path = req.nextUrl.pathname.replace(/^\/api\//, "");
    const url = `${backend}/${path}${req.nextUrl.search}`;

    const res = await fetch(url, {
      method: req.method,
      headers: copyHeaders(req.headers),
      cache: "no-store",
      redirect: "manual",
      ...(!["GET", "HEAD"].includes(req.method) && {
        body: req.body,
        duplex: "half",
      }),
    });

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: copyHeaders(res.headers),
    });
  };
}
