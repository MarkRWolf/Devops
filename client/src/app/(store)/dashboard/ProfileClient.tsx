"use client";
import { FormEvent, useState } from "react";
import { User } from "@/lib/user/user";
import { useRouter } from "next/navigation";
import { gitHubPatSchema } from "@/lib/user/userSchema";
import { ZodError } from "zod";
import { FaCheck } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { FaX } from "react-icons/fa6";

const ProfileClient = (props: { user: User }) => {
  const me = props.user;
  const [err, setErr] = useState<string>("");
  const [patInput, setPatInput] = useState<string>("");
  const [ownerRepoInput, setOwnerRepoInput] = useState<string>("");
  const [PatError, setPatError] = useState<string>("");
  const [OwnerRepoError, setOwnerRepoError] = useState<string>("");
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
    setOwnerRepoError("");
    setPatStatus("loading");

    const payload = {
      gitHubPat: patInput,
      GitHubOwnerRepo: ownerRepoInput,
    };

    try {
      gitHubPatSchema.parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        err.errors.forEach((e) => {
          if (e.path[0] === "gitHubPat") {
            setPatError(e.message);
          } else if (e.path[0] === "GitHubOwnerRepo") {
            setOwnerRepoError(e.message);
          }
        });
      }
      setPatStatus(null);
      return;
    }

    try {
      const response = await fetch(`/api/pat/github`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to store GitHub credentials.");
      }

      setPatStatus("complete");
      setPatError("");
      setOwnerRepoError("");
    } catch (err) {
      setPatError(
        `Failed to set GitHub credentials: ${
          err instanceof Error ? err.message : "An unexpected error occurred."
        }`
      );
    } finally {
      setPatStatus(null);
      setPatInput("");
      setOwnerRepoInput("");
    }
  }

  return (
    <main className="bg-card rounded-xl max-w-5xl mx-auto py-4 px-8 border space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p>Username: {me.username}</p>
        <p>Email: {me.email}</p>
        <p className="flex items-center">
          GitHub: &nbsp;{me.hasGitHubConfig ? <FaCheck /> : <FaX />}
        </p>
      </div>
      <form onSubmit={submitPat}>
        <div className="space-y-4">
          <div>
            <label htmlFor="pat" className="block text-sm font-medium text-muted-foreground">
              GitHub PAT
            </label>
            <div className="flex items-center gap-2 max-w-[400px]">
              <input
                id="pat"
                type="password"
                required
                value={patInput}
                onChange={(e) => setPatInput(e.target.value)}
                className="w-full px-3 py-2 border rounded shadow-sm"
                placeholder="PAT (Personal Access Token)"
              />
            </div>
            {PatError && <p className="mt-1 text-sm text-red-600">{PatError}</p>}
          </div>

          <div>
            <label htmlFor="ownerRepo" className="block text-sm font-medium text-muted-foreground">
              GitHub Owner/Repo
            </label>
            <div className="flex items-center gap-2 max-w-[400px]">
              <input
                id="ownerRepo"
                required
                value={ownerRepoInput}
                onChange={(e) => setOwnerRepoInput(e.target.value)}
                className="w-full px-3 py-2 border rounded shadow-sm"
                placeholder="owner/repo"
              />
            </div>
            {OwnerRepoError && <p className="mt-1 text-sm text-red-600">{OwnerRepoError}</p>}
          </div>

          <Button type="submit" disabled={patStatus === "loading"}>
            {patStatus === "loading" ? (
              "Please wait…"
            ) : patStatus === "complete" ? (
              <FaCheck />
            ) : (
              "Submit GitHub Credentials"
            )}
          </Button>
        </div>
        {err && <p className="mt-4 p-2 rounded bg-red-100 text-red-700">{err}</p>}
      </form>
      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </main>
  );
};

export default ProfileClient;
