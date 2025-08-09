export const dynamic = "force-dynamic";

import CIFilter from "@/components/ci/CIFilter";
import CIMetrics from "@/components/sections/CIMetrics";
import { getAzureData, getGitHubData } from "@/lib/ci/server";
import { requireAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardCharts({
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
    <>
      <CIFilter available={available} defaultProvider={defaultProvider} />
      <CIMetrics workflowRuns={workflowRuns} azureBuilds={azureBuilds} view="charts" />
    </>
  );
}
