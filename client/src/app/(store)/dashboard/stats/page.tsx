export const dynamic = "force-dynamic";
import Charts from "@/components/charts/Charts";
import DashboardNav from "@/components/dashboardNav/DashboardNav";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardStats() {
  await checkAuth();
  const workflowRuns = await fetchWorkflowRuns();

  return (
    <div>
      <DashboardNav />
      <div>
        <Charts workflowRuns={workflowRuns} />
        <WorkflowRuns runs={workflowRuns} />
      </div>
    </div>
  );
}
