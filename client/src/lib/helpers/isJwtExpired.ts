export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf8")
    ) as { exp?: number };

    if (!payload.exp) return true;

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

