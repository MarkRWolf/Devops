export const serverUrl = process.env.NEXT_PUBLIC_API_URL || "";
export const baseUrl =
  process.env.NEXT_PUBLIC_SELF_URL ||
  (() => {
    throw new Error("Env var NEXT_PUBLIC_SELF_URL is not set!");
  })();
