export const dynamic = "force-dynamic";
import Charts from "@/components/charts/Charts";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import { WorkflowUpdatesProvider } from "@/components/github/WorkflowUpdatesProvider";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardStats() {
  await checkAuth();
  const workflowRuns = await fetchWorkflowRuns();

  return (
    <div>
      <div>
        <Charts workflowRuns={workflowRuns} />
        <WorkflowUpdatesProvider>
          <WorkflowRuns runs={workflowRuns} />
        </WorkflowUpdatesProvider>
      </div>
    </div>
  );
}
