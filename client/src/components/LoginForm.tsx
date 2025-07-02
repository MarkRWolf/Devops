"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const url = mode === "login" ? "/api/account/login" : "/api/account/signup";
    const payload = mode === "login" ? { email, password } : { email, password, userName };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.message || "Something went wrong" });
      } else {
        setMessage({
          type: "success",
          text: mode === "login" ? "Logged in!" : "Account created!",
        });
        router.push("/dashboard");
      }
    } catch {
      setMessage({ type: "error", text: "Network error, try again" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold text-center mb-4">
        {mode === "login" ? "Login" : "Sign Up"}
      </h2>

      {message && (
        <p
          className={`mb-4 p-2 rounded ${
            message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {mode === "signup" && (
          <div>
            <label htmlFor="username" className="block font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded"
            />
          </div>
        )}

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
