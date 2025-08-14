export const dynamic = "force-dynamic";

import CIFilter from "@/components/ci/CIFilter";
import CIMetrics from "@/components/sections/CIMetrics";
import { requireAuth } from "@/lib/helpers/checkAuth";
import { getGitHubData, getAzureData } from "@/lib/ci/server";

export default async function DashboardRuns({
  searchParams,
}: {
  searchParams: Promise<{ ci?: string }>;
}) {
  const user = await requireAuth();
  const available = {
    gh: user.hasGitHubConfig,
    az: user.hasAzureConfig,
  } as const;

  const defaultProvider = available.gh ? "gh" : "az";
  const ciTag = await searchParams;
  const ci = ciTag.ci === "az" && available.az ? "az" : defaultProvider;

  const [workflowRuns, azureBuilds] =
    ci === "gh"
      ? [await getGitHubData("user"), undefined]
      : [undefined, await getAzureData("user")];

  return (
    <div className="flex flex-col items-center gap-2">
      <CIFilter available={available} defaultProvider={defaultProvider} />
      <CIMetrics workflowRuns={workflowRuns} azureBuilds={azureBuilds} view="runs" />
    </div>
  );
}
