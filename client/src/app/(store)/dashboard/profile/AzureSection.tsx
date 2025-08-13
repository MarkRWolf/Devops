"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { azurePatSchema } from "@/lib/user/userSchema";
import { ZodError } from "zod";
import { FaCheck } from "react-icons/fa";
import { RxUpdate } from "react-icons/rx";
import { FiCopy } from "react-icons/fi";

type Busy = "loading" | "complete" | null;

export default function AzureSection() {
  const [err, setErr] = useState("");

  const [org, setOrg] = useState("");
  const [project, setProject] = useState("");
  const [pat, setPat] = useState("");

  const [orgErr, setOrgErr] = useState("");
  const [projErr, setProjErr] = useState("");
  const [patErr, setPatErr] = useState("");
  const [status, setStatus] = useState<Busy>(null);

  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [secretBusy, setSecretBusy] = useState<"loading" | null>(null);

  const refreshSecret = async () => {
    if (!confirm("Generate a new Azure webhook secret? The previous secret will be invalidated."))
      return;
    setErr("");
    setSecretBusy("loading");
    try {
      const res = await fetch(`/api/pat/azure/webhook-secret/refresh`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        let msg = "Unable to refresh Azure webhook secret.";
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
        `Failed to refresh Azure webhook secret: ${
          e instanceof Error ? e.message : "Unexpected error."
        }`
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

  const submitAzure = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setOrgErr("");
    setProjErr("");
    setPatErr("");
    setStatus("loading");

    const payload = { azurePat: pat, organization: org, project };

    try {
      azurePatSchema.parse(payload);
    } catch (z) {
      if (z instanceof ZodError) {
        for (const issue of z.errors) {
          if (issue.path[0] === "azurePat") setPatErr(issue.message);
          if (issue.path[0] === "organization") setOrgErr(issue.message);
          if (issue.path[0] === "project") setProjErr(issue.message);
        }
      }
      setStatus(null);
      return;
    }

    try {
      const res = await fetch(`/api/pat/azure`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Failed to store Azure credentials.";
        try {
          const j = await res.json();
          msg = j.message ?? msg;
        } catch {}
        throw new Error(msg);
      }

      setStatus("complete");
      setOrg("");
      setProject("");
      setPat("");
    } catch (e) {
      setPatErr(
        `Failed to set Azure credentials: ${e instanceof Error ? e.message : "Unexpected error."}`
      );
    } finally {
      setTimeout(() => setStatus(null), 1000);
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

      <form onSubmit={submitAzure} className="space-y-4">
        <div>
          <label htmlFor="az-org" className="block text-sm font-medium text-muted-foreground">
            Azure Organization
          </label>
          <input
            id="az-org"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
            placeholder="my-org"
          />
          {orgErr && <p className="mt-1 text-sm text-red-600">{orgErr}</p>}
        </div>

        <div>
          <label htmlFor="az-project" className="block text-sm font-medium text-muted-foreground">
            Azure Project
          </label>
          <input
            id="az-project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
            placeholder="my-project"
          />
          {projErr && <p className="mt-1 text-sm text-red-600">{projErr}</p>}
        </div>

        <div>
          <label htmlFor="az-pat" className="block text-sm font-medium text-muted-foreground">
            Azure PAT
          </label>
          <input
            id="az-pat"
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
            placeholder="Personal Access Token"
          />
          {patErr && <p className="mt-1 text-sm text-red-600">{patErr}</p>}
        </div>

        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? (
            "Please wait…"
          ) : status === "complete" ? (
            <FaCheck />
          ) : (
            "Submit Azure Credentials"
          )}
        </Button>
      </form>
    </section>
  );
}
