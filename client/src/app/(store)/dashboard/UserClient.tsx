"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/user/user";

interface ApiResult<T> {
  ok: true;
  data: T;
}

interface ApiError {
  ok: false;
  message: string;
}
const UserClient = (props: { user: User }) => {
  const [me, setMe] = useState<User>(props.user);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");

  async function fetchMe() {
    setErr("");
    // Client always calls its own /api route
    const res = await apiFetch<User>(`/api/account/me`);

    if (res.ok) setMe(res.data);
    else setErr(res.message);
  }

  async function checkHealth() {
    setErr("");
    setHealthStatus(null);
    const res = await fetch(`/api/health`, { cache: "no-store" });
    if (res.ok) {
      setHealthStatus(`Health check OK (Status: ${res.status})`);
    } else {
      const msg = (await res.text()) || res.statusText;
      setErr(`Health check failed: ${msg} (Status: ${res.status})`);
    }
  }

  /* ───────── helper ───────── */
  async function apiFetch<T>(
    input: RequestInfo,
    init?: RequestInit
  ): Promise<ApiResult<T> | ApiError> {
    // Always make a relative fetch.
    const res = await fetch(input, { credentials: "include", cache: "no-store", ...init });
    if (!res.ok) {
      const msg = (await res.text()) || res.statusText;
      return { ok: false, message: msg };
    }
    return { ok: true, data: (await res.json()) as T };
  }
  return (
    <main className="text-center space-y-4 py-10">
      <h1 className="text-2xl font-bold">DevOps Demo</h1>
      <h2>Hey guys xd</h2>
      <Button variant="outline" onClick={fetchMe}>
        Call /me
      </Button>
      <Button variant="outline" onClick={checkHealth}>
        Check Health (/api/health)
      </Button>

      {err && <p className="text-red-600">{err}</p>}

      {me && (
        <p className="text-blue-600">
          /me → {me.email} (id {me.id})
        </p>
      )}

      {healthStatus && <p className="text-purple-600">{healthStatus}</p>}
    </main>
  );
};

export default UserClient;
