"use client";
import { FormEvent, useState } from "react";
import { User } from "@/lib/user/user";
import { useRouter } from "next/navigation";
import { gitHubPatSchema, azurePatSchema } from "@/lib/user/userSchema";
import { ZodError } from "zod";
import { FaCheck } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { FaX } from "react-icons/fa6";
import { RxUpdate } from "react-icons/rx";
import { FiCopy } from "react-icons/fi";

const ProfileClient = (props: { user: User }) => {
  const me = props.user;
  const [err, setErr] = useState("");
  const [patInput, setPatInput] = useState("");
  const [ownerRepoInput, setOwnerRepoInput] = useState("");
  const [patError, setPatError] = useState("");
  const [ownerRepoError, setOwnerRepoError] = useState("");
  const [patStatus, setPatStatus] = useState<"loading" | "complete" | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const [secretStatus, setSecretStatus] = useState<"loading" | null>(null);

  const [azureOrg, setAzureOrg] = useState("");
  const [azureProject, setAzureProject] = useState("");
  const [azurePat, setAzurePat] = useState("");
  const [azureOrgErr, setAzureOrgErr] = useState("");
  const [azureProjErr, setAzureProjErr] = useState("");
  const [azurePatErr, setAzurePatErr] = useState("");
  const [azureStatus, setAzureStatus] = useState<"loading" | "complete" | null>(null);

  const router = useRouter();

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

  async function submitPat(e: FormEvent) {
    e.preventDefault();
    setPatError("");
    setOwnerRepoError("");
    setPatStatus("loading");

    const payload = {
      gitHubPat: patInput,
      gitHubOwnerRepo: ownerRepoInput,
    };

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
      router.refresh();
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

  async function refreshSecret() {
    if (!confirm("Generate a new webhook secret? The previous secret will be invalidated.")) return;
    setErr("");
    setSecretStatus("loading");
    try {
      const res = await fetch(`/api/pat/github/webhook-secret/refresh`, {
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

  async function submitAzure(e: FormEvent) {
    e.preventDefault();
    setAzureOrgErr("");
    setAzureProjErr("");
    setAzurePatErr("");
    setAzureStatus("loading");

    const payload = {
      azurePat,
      organization: azureOrg,
      project: azureProject,
    };

    try {
      azurePatSchema.parse(payload);
    } catch (err) {
      if (err instanceof ZodError) {
        err.errors.forEach((e) => {
          if (e.path[0] === "azurePat") setAzurePatErr(e.message);
          if (e.path[0] === "organization") setAzureOrgErr(e.message);
          if (e.path[0] === "project") setAzureProjErr(e.message);
        });
      }
      setAzureStatus(null);
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
        const data = await res.json();
        throw new Error(data.message ?? "Failed to store Azure credentials.");
      }

      setAzureStatus("complete");
      setAzureOrg("");
      setAzureProject("");
      setAzurePat("");
      router.refresh();
    } catch (e) {
      setAzurePatErr(
        `Failed to set Azure credentials: ${
          e instanceof Error ? e.message : "An unexpected error occurred."
        }`
      );
    } finally {
      setAzureStatus(null);
    }
  }

  const copySecret = async () => {
    if (!webhookSecret) return;
    try {
      await navigator.clipboard.writeText(webhookSecret);
      alert("Secret copied to clipboard.");
    } catch {
      alert("Unable to copy.");
    }
  };

  return (
    <main className="bg-card rounded-xl max-w-5xl mx-auto py-4 px-8 border space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p>Username: {me.username}</p>
        <p>Email: {me.email}</p>
        <p className="flex items-center gap-1">
          GitHub:&nbsp;{me.hasGitHubConfig ? <FaCheck /> : <FaX />}
        </p>
        <p className="flex items-center gap-1">
          Azure:&nbsp;{me.hasAzureConfig ? <FaCheck /> : <FaX />}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <p>Webhook&nbsp;Secret:</p>
          {webhookSecret ? (
            <>
              <code className="px-2 py-1 bg-muted rounded text-sm break-all">{webhookSecret}</code>
              <button type="button" className="p-1 hover:bg-muted rounded" onClick={copySecret}>
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
            disabled={secretStatus === "loading"}
          >
            {secretStatus === "loading" ? <RxUpdate className="animate-spin" /> : <RxUpdate />}
          </Button>
        </div>
      </div>

      <form onSubmit={submitPat}>
        <div className="space-y-4">
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

      <form onSubmit={submitAzure}>
        <div className="space-y-4">
          <div>
            <label htmlFor="azureOrg" className="block text-sm font-medium text-muted-foreground">
              Azure Organization
            </label>
            <input
              id="azureOrg"
              value={azureOrg}
              onChange={(e) => setAzureOrg(e.target.value)}
              className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
              placeholder="my-org"
            />
            {azureOrgErr && <p className="mt-1 text-sm text-red-600">{azureOrgErr}</p>}
          </div>
          <div>
            <label
              htmlFor="azureProject"
              className="block text-sm font-medium text-muted-foreground"
            >
              Azure Project
            </label>
            <input
              id="azureProject"
              value={azureProject}
              onChange={(e) => setAzureProject(e.target.value)}
              className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
              placeholder="my-project"
            />
            {azureProjErr && <p className="mt-1 text-sm text-red-600">{azureProjErr}</p>}
          </div>
          <div>
            <label htmlFor="azurePat" className="block text-sm font-medium text-muted-foreground">
              Azure PAT
            </label>
            <input
              id="azurePat"
              type="password"
              value={azurePat}
              onChange={(e) => setAzurePat(e.target.value)}
              className="w-full max-w-[400px] px-3 py-2 border rounded shadow-sm"
              placeholder="Personal Access Token"
            />
            {azurePatErr && <p className="mt-1 text-sm text-red-600">{azurePatErr}</p>}
          </div>
          <Button type="submit" disabled={azureStatus === "loading"}>
            {azureStatus === "loading" ? (
              "Please wait…"
            ) : azureStatus === "complete" ? (
              <FaCheck />
            ) : (
              "Submit Azure Credentials"
            )}
          </Button>
        </div>
      </form>

      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </main>
  );
};

export default ProfileClient;
