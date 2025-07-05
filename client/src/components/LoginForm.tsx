"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";
import { signupSchema, loginSchema } from "@/lib/user/userSchema";

/* ─── minimal types ───────────────────────────────── */

interface ApiErrorPayload {
  errors?: string[];
  message?: string;
}

type Toast = { type: "error" | "success"; text: string } | null;

/* ─── component ───────────────────────────────────── */

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUserName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  /* ─── handlers ──────────────────────────────────── */

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = mode === "login" ? { email, password } : { email, password, username };

    /* Zod validation */
    try {
      (mode === "signup" ? signupSchema : loginSchema).parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        setFormError(err.errors.map((e) => e.message).join("; "));
      }
      setLoading(false);
      return;
    }

    const url = mode === "login" ? "/api/account/login" : "/api/account/signup";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data: ApiErrorPayload = await res.json();
        const text = data.errors?.join("; ") || data.message || "Something went wrong";
        setToast({ type: "error", text });
        return;
      }
      router.push("/dashboard");
    } catch {
      setToast({ type: "error", text: "Network error, try again" });
    } finally {
      setLoading(false);
    }
  }

  /* ─── render ────────────────────────────────────── */

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold text-center mb-4">
        {mode === "login" ? "Login" : "Sign Up"}
      </h2>

      {formError && <p className="mb-4 p-2 rounded bg-red-100 text-red-700">{formError}</p>}

      {toast && (
        <p
          className={`mb-4 p-2 rounded ${
            toast.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {toast.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Username (signup only) */}
        {mode === "signup" && (
          <div>
            <label htmlFor="username" className="block font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded"
            />
          </div>
        )}

        {/* Password */}
        <div>
          <label htmlFor="password" className="block font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "login" ? "Login" : "Sign Up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm">
        {mode === "login" ? (
          <>
            Don’t have an account?{" "}
            <button onClick={() => setMode("signup")} className="text-indigo-600 hover:underline">
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => setMode("login")} className="text-indigo-600 hover:underline">
              Login
            </button>
          </>
        )}
      </p>
    </div>
  );
}
