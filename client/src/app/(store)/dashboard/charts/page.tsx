export const dynamic = "force-dynamic";
import AzureCharts from "@/components/azure/AzureCharts";
import Charts from "@/components/charts/Charts";
import { fetchAzureBuilds } from "@/lib/azure/helpers";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardRuns() {
  await checkAuth();
  const [workflowRuns, azureBuilds] = await Promise.all([fetchWorkflowRuns(), fetchAzureBuilds()]);

  return (
    <>
      <Charts workflowRuns={workflowRuns} />
      <AzureCharts builds={azureBuilds} />
    </>
  );
}
