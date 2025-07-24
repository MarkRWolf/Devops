export const dynamic = "force-dynamic";

import { checkAuth } from "@/lib/helpers/checkAuth";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import ProfileMain from "./ProfileMain";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import Charts from "@/components/charts/Charts";

export default async function DashboardHome() {
  const user = await checkAuth();
  const workflowRuns = await fetchWorkflowRuns();

  return (
    <div>
      <ProfileMain user={user} />
      <Charts workflowRuns={workflowRuns} />
      <WorkflowRuns runs={workflowRuns} />
    </div>
  );
}
