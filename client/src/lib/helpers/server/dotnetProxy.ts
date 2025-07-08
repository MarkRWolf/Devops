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

export function makeDotnetProxy() {
  return async function handler(req: NextRequest) {
    const backend = process.env.DOTNET_API_BASE_URL;
    if (!backend) throw new Error("DOTNET_API_BASE_URL is not set");

    const path = req.nextUrl.pathname.replace(/^\/api\//, "");
    const url = `${backend}/${path}${req.nextUrl.search}`;

    let res: Response | undefined;
    try {
      res = await fetch(url, {
        method: req.method,
        headers: copyHeaders(req.headers),
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

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: copyHeaders(res.headers),
    });
  };
}
