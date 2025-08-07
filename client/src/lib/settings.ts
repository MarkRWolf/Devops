export const serverUrl = process.env.NEXT_PUBLIC_API_URL || "";

export const selfUrl =
  process.env.NEXT_PUBLIC_SELF_URL ||
  (() => {
    throw new Error("Env var NEXT_PUBLIC_SELF_URL is not set!");
  })();

export const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || null;

export const clientBaseUrl = proxyUrl ? proxyUrl + "/api" : "/api";
export const baseUrl = selfUrl;
