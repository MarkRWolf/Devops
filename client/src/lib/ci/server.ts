// client/src/lib/ci/server.ts
import { fetchWorkflowRunsByScope, fetchAzureBuildsByScope, Scope } from "./api";
import type { GitHubWorkflowRun } from "@/lib/github/models";
import type { AzureBuild } from "@/lib/azure/models";

export async function getGitHubData(scope: Scope = "user"): Promise<GitHubWorkflowRun[]> {
  return fetchWorkflowRunsByScope(scope);
}

export async function getAzureData(scope: Scope = "user"): Promise<AzureBuild[]> {
  return fetchAzureBuildsByScope(scope);
}

export async function getCiData(scope: Scope = "user"): Promise<{
  workflowRuns: GitHubWorkflowRun[];
  azureBuilds: AzureBuild[];
}> {
  const [workflowRuns, azureBuilds] = await Promise.all([
    getGitHubData(scope),
    getAzureData(scope),
  ]);
  return { workflowRuns, azureBuilds };
}
