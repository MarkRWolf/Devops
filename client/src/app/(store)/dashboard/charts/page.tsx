export const dynamic = "force-dynamic";
import Charts from "@/components/charts/Charts";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardRuns() {
  await checkAuth();
  const workflowRuns = await fetchWorkflowRuns();

  return <Charts workflowRuns={workflowRuns} />;
}
