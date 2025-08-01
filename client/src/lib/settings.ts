export const serverUrl = process.env.NEXT_PUBLIC_API_URL || "";

export const selfUrl =
  process.env.NEXT_PUBLIC_SELF_URL ||
  (() => {
    throw new Error("Env var NEXT_PUBLIC_SELF_URL is not set!");
  })();

export const proxyUrl = process.env.NEXT_PUBLIC_NGINX_URL || null;

export const clientBaseUrl = proxyUrl ? proxyUrl + "/API" : selfUrl + "/api";
export const baseUrl = selfUrl;
