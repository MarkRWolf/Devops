// client/src/lib/helpers/server/dotnetProxy.ts
import { NextRequest, NextResponse } from "next/server";

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

type ProxyOptions =
  | { extraHeaders?: Record<string, string> }
  | ((req: NextRequest) => Record<string, string>);

export function makeDotnetProxy(options?: ProxyOptions) {
  return async function handler(req: NextRequest) {
    const backend = process.env.DOTNET_API_BASE_URL;
    if (!backend) throw new Error("DOTNET_API_BASE_URL is not set");

    const path = req.nextUrl.pathname.replace(/^\/api\//, "");
    const url = `${backend}/${path}${req.nextUrl.search}`;

    let resolvedExtraHeaders: Record<string, string> = {};

    if (typeof options === "function") {
      resolvedExtraHeaders = options(req);
    } else if (options?.extraHeaders) {
      resolvedExtraHeaders = options.extraHeaders;
    }

    let res: Response | undefined;
    try {
      res = await fetch(url, {
        method: req.method,
        headers: copyHeaders(req.headers, resolvedExtraHeaders),
        cache: "no-store",
        redirect: "manual",
        ...(!["GET", "HEAD"].includes(req.method) && {
          body: req.body,
          duplex: "half",
        }),
      });
    } catch (err) {
      console.log("Internal server error:", err);
      return new NextResponse("Internal server error", { status: 500 });
    }

    const outHeaders = copyHeaders(res.headers);
    outHeaders.set("x-proxied-by", "nextjs");

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: outHeaders,
    });
  };
}
