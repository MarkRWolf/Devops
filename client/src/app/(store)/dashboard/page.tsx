export const dynamic = "force-dynamic";

import { checkAuth } from "@/lib/helpers/checkAuth";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import Charts from "@/components/charts/Charts";
import { redirect } from "next/navigation";
import { WorkflowUpdatesProvider } from "@/components/github/WorkflowUpdatesProvider";
import { fetchAzureBuilds } from "@/lib/azure/helpers";
import AzureBuilds from "@/components/azure/AzureBuilds";
import AzureCharts from "@/components/azure/AzureCharts";

export default async function DashboardHome() {
  const user = await checkAuth();
  if (!user) redirect("/");
  const [workflowRuns, azureBuilds] = await Promise.all([fetchWorkflowRuns(), fetchAzureBuilds()]);

  return (
    <div>
      <Charts workflowRuns={workflowRuns} />
      <WorkflowUpdatesProvider>
        <WorkflowRuns runs={workflowRuns} />
      </WorkflowUpdatesProvider>

      <AzureCharts builds={azureBuilds} />
      <AzureBuilds builds={azureBuilds} />
    </div>
  );
}
