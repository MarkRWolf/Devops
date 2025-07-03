interface ApiFetchResult<T> {
  ok: true;
  data: T;
}

interface ApiFetchError {
  ok: false;
  message: string;
}

export async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<ApiFetchResult<T> | ApiFetchError> {
  const res = await fetch(input, { credentials: "include", cache: "no-store", ...init });
  if (!res.ok) {
    const msg = (await res.text()) || res.statusText;
    return { ok: false, message: msg };
  }
  return { ok: true, data: (await res.json()) as T };
}
