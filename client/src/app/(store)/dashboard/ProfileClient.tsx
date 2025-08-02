"use client";
import { FormEvent, useState } from "react";
import { User } from "@/lib/user/user";
import { useRouter } from "next/navigation";
import { gitHubPatSchema } from "@/lib/user/userSchema";
import { ZodError } from "zod";
import { FaCheck } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { FaX } from "react-icons/fa6";
import { RxUpdate } from "react-icons/rx";
import { FiCopy } from "react-icons/fi";
import { clientBaseUrl } from "@/lib/settings";

const ProfileClient = (props: { user: User }) => {
  const me = props.user;

  /* ───────── local state ───────── */
  const [err, setErr] = useState<string>("");
  const [patInput, setPatInput] = useState<string>("");
  const [ownerRepoInput, setOwnerRepoInput] = useState<string>("");
  const [patError, setPatError] = useState<string>("");
  const [ownerRepoError, setOwnerRepoError] = useState<string>("");
  const [patStatus, setPatStatus] = useState<"loading" | "complete" | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [secretStatus, setSecretStatus] = useState<"loading" | null>(null);

  const router = useRouter();

  /* ───────── handlers ───────── */

  /** Log the user out */
  async function logout() {
    setErr("");
    try {
      await fetch(`/api/account/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      router.push("/");
    } catch {
      setErr("Logout failed. Likely a network error.");
    }
  }

  /** Submit/validate PAT + repo */
  async function submitPat(e: FormEvent) {
    e.preventDefault();
    setPatError("");
    setOwnerRepoError("");
    setPatStatus("loading");

    const payload = {
      gitHubPat: patInput,
      GitHubOwnerRepo: ownerRepoInput,
    };

    // Zod validation on the client first
    try {
      gitHubPatSchema.parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        err.errors.forEach((e) => {
          if (e.path[0] === "gitHubPat") setPatError(e.message);
          if (e.path[0] === "GitHubOwnerRepo") setOwnerRepoError(e.message);
        });
      }
      setPatStatus(null);
      return;
    }

    // Call backend
    try {
      const res = await fetch(`/api/pat/github`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Failed to store GitHub credentials.");
      }

      setPatStatus("complete");
      setPatError("");
      setOwnerRepoError("");
    } catch (e) {
      setPatError(
        `Failed to set GitHub credentials: ${
          e instanceof Error ? e.message : "An unexpected error occurred."
        }`
      );
    } finally {
      setPatStatus(null);
      setPatInput("");
      setOwnerRepoInput("");
    }
  }

  /** Generate a brand-new webhook secret, returning it *once* */
  async function refreshSecret() {
    if (
      !confirm(
        "Generate a new webhook secret? The previous secret will be invalidated and cannot be recovered."
      )
    )
      return;

    setErr("");
    setSecretStatus("loading");
    try {
      const res = await fetch(`${clientBaseUrl}/pat/github/webhook-secret/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Unable to refresh webhook secret.");
      }

      const { webhookSecret: secret } = (await res.json()) as { webhookSecret: string };
      setWebhookSecret(secret);
    } catch (e) {
      setErr(
        `Failed to refresh webhook secret: ${
          e instanceof Error ? e.message : "An unexpected error occurred."
        }`
      );
    } finally {
      setSecretStatus(null);
    }
  }

  /* ───────── helpers ───────── */

  const copySecret = async () => {
    if (!webhookSecret) return;
    try {
      await navigator.clipboard.writeText(webhookSecret);
      alert("Secret copied to clipboard.");
    } catch {
      alert("Unable to copy.");
    }
  };

  /* ───────── UI ───────── */

  return (
    <main className="bg-card rounded-xl max-w-5xl mx-auto py-4 px-8 border space-y-4">
      {/* top block */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p>Username: {me.username}</p>
        <p>Email: {me.email}</p>
        <p className="flex items-center gap-1">
          GitHub:&nbsp;{me.hasGitHubConfig ? <FaCheck /> : <FaX />}
        </p>

        {/* webhook secret block */}
        <div className="flex items-center gap-2 flex-wrap">
          <p>Webhook&nbsp;Secret:</p>

          {webhookSecret ? (
            <>
              <code className="px-2 py-1 bg-muted rounded text-sm break-all">{webhookSecret}</code>
              <button
                type="button"
                className="p-1 hover:bg-muted rounded"
                title="Copy to clipboard"
                onClick={copySecret}
              >
                <FiCopy />
              </button>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">not generated in this session</span>
          )}

          <Button
            variant="ghost"
            size="icon"
            title="Generate / refresh secret"
            onClick={refreshSecret}
            disabled={secretStatus === "loading"}
          >
            {secretStatus === "loading" ? <RxUpdate className="animate-spin" /> : <RxUpdate />}
          </Button>
        </div>
      </div>

      {/* PAT form */}
      <form onSubmit={submitPat}>
        <div className="space-y-4">
          {/* PAT input */}
          <div>
            <label htmlFor="pat" className="block text-sm font-medium text-muted-foreground">
              GitHub PAT
            </label>
            <input
              id="pat"
              type="password"
              required
              value={patInput}
              onChange={(e) => setPatInput(e.target.value)}
              className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
              placeholder="PAT (Personal Access Token)"
            />
            {patError && <p className="mt-1 text-sm text-red-600">{patError}</p>}
          </div>

          {/* Owner/repo input */}
          <div>
            <label htmlFor="ownerRepo" className="block text-sm font-medium text-muted-foreground">
              GitHub Owner/Repo
            </label>
            <input
              id="ownerRepo"
              required
              value={ownerRepoInput}
              onChange={(e) => setOwnerRepoInput(e.target.value)}
              className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
              placeholder="owner/repo"
            />
            {ownerRepoError && <p className="mt-1 text-sm text-red-600">{ownerRepoError}</p>}
          </div>

          {/* submit */}
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

      {/* logout */}
      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </main>
  );
};

export default ProfileClient;
