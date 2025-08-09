// ./client/src/app/(store)/dashboard/GitHubSection.tsx
"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { gitHubPatSchema } from "@/lib/user/userSchema";
import { ZodError } from "zod";
import { RxUpdate } from "react-icons/rx";
import { FiCopy } from "react-icons/fi";
import { FaCheck } from "react-icons/fa";

type Busy = "loading" | "complete" | null;

export default function GitHubSection() {
  const [err, setErr] = useState("");

  // webhook secret
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [secretBusy, setSecretBusy] = useState<"loading" | null>(null);

  // form
  const [ghPat, setGhPat] = useState("");
  const [ghOwnerRepo, setGhOwnerRepo] = useState("");
  const [ghPatErr, setGhPatErr] = useState("");
  const [ghOwnerRepoErr, setGhOwnerRepoErr] = useState("");
  const [ghStatus, setGhStatus] = useState<Busy>(null);

  const refreshSecret = async () => {
    if (!confirm("Generate a new webhook secret? The previous secret will be invalidated.")) return;
    setErr("");
    setSecretBusy("loading");
    try {
      const res = await fetch(`/api/pat/github/webhook-secret/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        let msg = "Unable to refresh webhook secret.";
        try {
          const j = await res.json();
          msg = j.message ?? msg;
        } catch {}
        throw new Error(msg);
      }
      const { webhookSecret: secret } = (await res.json()) as { webhookSecret: string };
      setWebhookSecret(secret);
    } catch (e) {
      setErr(
        `Failed to refresh webhook secret: ${e instanceof Error ? e.message : "Unexpected error."}`
      );
    } finally {
      setSecretBusy(null);
    }
  };

  const copySecret = async () => {
    if (!webhookSecret) return;
    try {
      await navigator.clipboard.writeText(webhookSecret);
      alert("Secret copied to clipboard.");
    } catch {
      alert("Unable to copy.");
    }
  };

  const submitGitHub = async (e: FormEvent) => {
    e.preventDefault();
    setGhPatErr("");
    setGhOwnerRepoErr("");
    setGhStatus("loading");

    const payload = { gitHubPat: ghPat, gitHubOwnerRepo: ghOwnerRepo };

    try {
      gitHubPatSchema.parse(payload);
    } catch (z) {
      if (z instanceof ZodError) {
        for (const issue of z.errors) {
          if (issue.path[0] === "gitHubPat") setGhPatErr(issue.message);
          if (issue.path[0] === "gitHubOwnerRepo") setGhOwnerRepoErr(issue.message);
        }
      }
      setGhStatus(null);
      return;
    }

    try {
      const res = await fetch(`/api/pat/github`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Failed to store GitHub credentials.";
        try {
          const j = await res.json();
          msg = j.message ?? msg;
        } catch {}
        throw new Error(msg);
      }

      setGhStatus("complete");
      setGhPat("");
      setGhOwnerRepo("");
    } catch (e) {
      setGhPatErr(
        `Failed to set GitHub credentials: ${e instanceof Error ? e.message : "Unexpected error."}`
      );
    } finally {
      setTimeout(() => setGhStatus(null), 1000);
    }
  };

  return (
    <section className="space-y-6 border rounded-lg p-4">
      {err && <p className="p-2 rounded bg-red-100 text-red-700">{err}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <p>Webhook&nbsp;Secret:</p>
        {webhookSecret ? (
          <>
            <code className="px-2 py-1 bg-muted rounded text-sm break-all">{webhookSecret}</code>
            <button
              type="button"
              className="p-1 hover:bg-muted rounded"
              onClick={copySecret}
              aria-label="Copy webhook secret"
              title="Copy webhook secret"
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
          onClick={refreshSecret}
          disabled={secretBusy === "loading"}
          aria-label="Refresh webhook secret"
          title="Refresh webhook secret"
        >
          {secretBusy === "loading" ? <RxUpdate className="animate-spin" /> : <RxUpdate />}
        </Button>
      </div>

      <form onSubmit={submitGitHub} className="space-y-4">
        <div>
          <label htmlFor="gh-pat" className="block text-sm font-medium text-muted-foreground">
            GitHub PAT
          </label>
          <input
            id="gh-pat"
            type="password"
            required
            value={ghPat}
            onChange={(e) => setGhPat(e.target.value)}
            className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
            placeholder="PAT (Personal Access Token)"
          />
          {ghPatErr && <p className="mt-1 text-sm text-red-600">{ghPatErr}</p>}
        </div>

        <div>
          <label htmlFor="gh-ownerRepo" className="block text-sm font-medium text-muted-foreground">
            GitHub Owner/Repo
          </label>
          <input
            id="gh-ownerRepo"
            required
            value={ghOwnerRepo}
            onChange={(e) => setGhOwnerRepo(e.target.value)}
            className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
            placeholder="owner/repo"
          />
          {ghOwnerRepoErr && <p className="mt-1 text-sm text-red-600">{ghOwnerRepoErr}</p>}
        </div>

        <Button type="submit" disabled={ghStatus === "loading"}>
          {ghStatus === "loading" ? (
            "Please wait…"
          ) : ghStatus === "complete" ? (
            <FaCheck />
          ) : (
            "Submit GitHub Credentials"
          )}
        </Button>
      </form>
    </section>
  );
}
