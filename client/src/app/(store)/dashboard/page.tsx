export const dynamic = "force-dynamic";
import { checkAuth } from "@/lib/helpers/checkAuth";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import ProfileMain from "./ProfileMain";
import WorkflowRuns from "@/components/github/WorkflowRuns";

export default async function DashboardHome() {
  const user = await checkAuth();
  const workflowRuns = await fetchWorkflowRuns();

  return (
    <div>
      <ProfileMain user={user} />
      <WorkflowRuns runs={workflowRuns} />
    </div>
  );
}
