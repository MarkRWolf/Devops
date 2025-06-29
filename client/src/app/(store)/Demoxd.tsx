"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { serverUrl } from "@/lib/settings";

/* ──────────── Types ──────────── */
interface User {
  id: number;
  email: string;
}

interface ApiResult<T> {
  ok: true;
  data: T;
}

interface ApiError {
  ok: false;
  message: string;
}

/* ───────── helper ───────── */
async function apiFetch<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<ApiResult<T> | ApiError> {
  const res = await fetch(input, { credentials: "include", cache: "no-store", ...init });
  if (!res.ok) {
    const msg = (await res.text()) || res.statusText;
    return { ok: false, message: msg };
  }
  return { ok: true, data: (await res.json()) as T };
}

/* ───────── component ───────── */
export default function Demo() {
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [err, setErr] = useState<string>("");

  async function signup() {
    setErr("");
    const email = `u${Math.floor(Math.random() * 1e6)}@demo.com`;
    const res = await apiFetch<User>(`${serverUrl}/api/account/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Passw0rd!" }),
    });

    if (res.ok) setUser(res.data);
    else setErr(res.message);
  }

  async function fetchMe() {
    setErr("");
    const res = await apiFetch<User>(`${serverUrl}/api/account/me`);

    if (res.ok) setMe(res.data);
    else setErr(res.message);
  }

  return (
    <main className="text-center space-y-4 py-10">
      <h1 className="text-2xl font-bold">DevOps Demo</h1>

      <Button onClick={signup}>Sign-up (sets cookie)</Button>
      <Button variant="outline" onClick={fetchMe}>
        Call /me
      </Button>

      {err && <p className="text-red-600">{err}</p>}

      {user && (
        <p className="text-green-600">
          Signed-up: {user.email} (id {user.id})
        </p>
      )}

      {me && (
        <p className="text-blue-600">
          /me → {me.email} (id {me.id})
        </p>
      )}
    </main>
  );
}
