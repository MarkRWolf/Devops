export const serverUrl = process.env.NEXT_PUBLIC_API_URL || "";
export const baseUrl =
  process.env.SELF_URL ??
  (() => {
    throw new Error("Env var SELF_URL is not set!");
  })();
