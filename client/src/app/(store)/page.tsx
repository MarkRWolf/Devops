// client/src/app/(store)/page.tsx
export const dynamic = "force-dynamic";

import WorkflowRuns from "@/components/github/WorkflowRuns";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import Charts from "@/components/charts/Charts";

export default async function Home() {
  const projectWorkflowRuns = await fetchWorkflowRuns("/project");

  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      <h1 className="text-xl">Welcome to my Devops Dashboard</h1>
      <Charts workflowRuns={projectWorkflowRuns} />

      <WorkflowRuns runs={projectWorkflowRuns} project={"/project"} />
    </div>
  );
}
