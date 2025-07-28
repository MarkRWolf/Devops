export const dynamic = "force-dynamic";

import { checkAuth } from "@/lib/helpers/checkAuth";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import Charts from "@/components/charts/Charts";
import { redirect } from "next/navigation";

export default async function DashboardHome() {
  const user = await checkAuth();
  if (!user) redirect("/login");
  const workflowRuns = await fetchWorkflowRuns();

  return (
    <div>
      <Charts workflowRuns={workflowRuns} />
      <WorkflowRuns runs={workflowRuns} />
    </div>
  );
}
