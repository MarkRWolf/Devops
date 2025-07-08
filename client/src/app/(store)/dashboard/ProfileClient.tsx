"use client";
import { FormEvent, useState } from "react";
import { User } from "@/lib/user/user";
import { useRouter } from "next/navigation";
import { gitHubPatSchema } from "@/lib/user/userSchema";
import { ZodError } from "zod";
import { FaCheck } from "react-icons/fa";
import { Button } from "@/components/ui/button";

const ProfileClient = (props: { user: User }) => {
  const me = props.user;
  const [err, setErr] = useState<string>("");
  const [patInput, setPatInput] = useState<string>("");
  const [PatError, setPatError] = useState<string>("");
  const [patStatus, setPatStatus] = useState<"loading" | "complete" | null>(null);

  const router = useRouter();

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
    setPatError("");
    setPatStatus("loading");
    const payload = { patInput: patInput };
    try {
      gitHubPatSchema.parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        setPatError(err.errors.map((e) => e.message).join("; "));
      }
      setPatStatus(null);
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
        setPatStatus("complete");
        setPatError("");
      })
      .catch((err) => {
        setPatError(
          `Failed to set GitHub PAT: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      })
      .finally(() => {
        setPatStatus(null);
        setPatInput("");
      });
  }

  return (
    <main className="max-w-5xl mx-auto py-4 px-8 border space-y-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p>Username: {me.username}</p>
        <p>Email: {me.email}</p>
      </div>
      <form onSubmit={submitPat}>
        <label htmlFor="pat">PAT</label>
        <div className="flex items-center gap-2 max-w-[400px]">
          <input
            id="pat"
            required
            value={patInput}
            onChange={(e) => setPatInput(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
          <Button type="submit" disabled={patStatus === "loading"}>
            {patStatus === "loading" ? (
              "Please wait…"
            ) : patStatus === "complete" ? (
              <FaCheck />
            ) : (
              "submit PAT"
            )}
          </Button>
        </div>
        {PatError && <p className="mb-4 p-2 rounded bg-red-100 text-red-700">{PatError}</p>}
        {err && <p className="text-red-600">{err}</p>}
      </form>
      <Button variant="outline" onClick={logout} className="cursor-pointer">
        Logout
      </Button>
    </main>
  );
};

export default ProfileClient;
