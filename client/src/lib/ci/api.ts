import { headers } from "next/headers";
import { GitHubWorkflowRun } from "@/lib/ci/github/models";
import { AzureBuild } from "@/lib/azure/models";
import { baseUrl } from "../settings";

export type Scope = "user" | "project";

function scopePrefix(scope: Scope) {
  return scope === "project" ? "/project" : "";
}

async function apiGet<T>(path: string): Promise<T> {
  const h = new Headers(await headers());
  const url = `${baseUrl}${path}`;
  const cookie = h.get("cookie") || "";
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  });
  if (!res.ok) return [] as unknown as T;
  return (await res.json()) as T;
}

export async function fetchWorkflowRunsByScope(
  scope: Scope = "user"
): Promise<GitHubWorkflowRun[]> {
  return apiGet(`/api/github${scopePrefix(scope)}/workflows/runs`);
}

export async function fetchAzureBuildsByScope(scope: Scope = "user"): Promise<AzureBuild[]> {
  return apiGet(`/api/azure${scopePrefix(scope)}/builds`);
}
