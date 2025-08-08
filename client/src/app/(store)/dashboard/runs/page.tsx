export const dynamic = "force-dynamic";
import AzureBuilds from "@/components/azure/AzureBuilds";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import { WorkflowUpdatesProvider } from "@/components/github/WorkflowUpdatesProvider";
import { fetchAzureBuilds } from "@/lib/azure/helpers";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardStats() {
  await checkAuth();
  const [workflowRuns, azureBuilds] = await Promise.all([fetchWorkflowRuns(), fetchAzureBuilds()]);

  return (
    <>
      <WorkflowUpdatesProvider>
        <WorkflowRuns runs={workflowRuns} />
      </WorkflowUpdatesProvider>
      <AzureBuilds builds={azureBuilds} />
    </>
  );
}
