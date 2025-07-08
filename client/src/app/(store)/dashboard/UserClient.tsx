"use client";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/user/user";
import { apiFetch } from "@/lib/helpers/fetchHelpers";
import { useRouter } from "next/navigation";
import { gitHubPatSchema } from "@/lib/user/userSchema";
import { ZodError } from "zod";

const UserClient = (props: { user: User }) => {
  const [me, setMe] = useState<User>(props.user);
  const [healthStatus, setHealthStatus] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [gitHubPat, setGitHubPat] = useState<string>("");
  const [gitHubPatError, setGitHubPatError] = useState<string>("");
  const [patLoading, setPatLoading] = useState<boolean>(false);

  const router = useRouter();
  async function fetchMe() {
    setErr("");
    // Client always calls its own /api route
    const res = await apiFetch<User>(`/api/account/me`);

    if (res.ok) setMe(res.data);
    else setErr(res.message);
  }

  async function checkHealth() {
    setErr("");
    setHealthStatus("");
    const res = await fetch(`/api/health`, { cache: "no-store" });
    if (res.ok) {
      setHealthStatus(`Health check OK (Status: ${res.status})`);
    } else {
      const msg = (await res.text()) || res.statusText;
      setErr(`Health check failed: ${msg} (Status: ${res.status})`);
    }
  }

  async function logout() {
    setErr("");
    await fetch(`/api/account/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
      .then(() => {
        router.push("/login");
      })
      .catch(() => {
        setErr("Logout failed. Likely a network error.");
      });
  }

  async function submitPat(e: FormEvent) {
    e.preventDefault();
    setGitHubPatError("");
    setPatLoading(true);
    const payload = { gitHubPat: gitHubPat };
    try {
      gitHubPatSchema.parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        setGitHubPatError(err.errors.map((e) => e.message).join("; "));
      }
      setPatLoading(false);
      return;
    }

    await fetch(`/api/pat/github`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(() => {
        setGitHubPatError("");
      })
      .catch((err) => {
        setGitHubPatError(
          `Failed to set GitHub PAT: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      })
      .finally(() => {
        setPatLoading(false);
        setGitHubPat("");
      });
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
      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
      <form onSubmit={submitPat} className="">
        {gitHubPatError && (
          <p className="mb-4 p-2 rounded bg-red-100 text-red-700">{gitHubPatError}</p>
        )}
        <div className="flex">
          <label htmlFor="pat" className="block font-medium">
            PAT
          </label>
          <input
            id="pat"
            required
            value={gitHubPat}
            onChange={(e) => setGitHubPat(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded"
          />
          <button
            type="submit"
            disabled={patLoading}
            className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {patLoading ? "Please wait…" : "submit PAT"}
          </button>
        </div>
      </form>
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
