export const dynamic = "force-dynamic";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import { WorkflowUpdatesProvider } from "@/components/github/WorkflowUpdatesProvider";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardStats() {
  await checkAuth();
  const workflowRuns = await fetchWorkflowRuns();

  return (
    <WorkflowUpdatesProvider initialRun={workflowRuns[0]}>
      <WorkflowRuns runs={workflowRuns} project="/project" />
    </WorkflowUpdatesProvider>
  );
}
