// client/src/app/(store)/page.tsx
export const dynamic = "force-dynamic";

import WorkflowRuns from "@/components/github/WorkflowRuns";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import Charts from "@/components/charts/Charts";
import { WorkflowUpdatesProvider } from "@/components/github/WorkflowUpdatesProvider";
import Link from "next/link";

export default async function Home() {
  const projectWorkflowRuns = await fetchWorkflowRuns("/project");

  return (
    <div className="flex flex-col items-center gap-4 mt-10">
      <h1 className="text-xl">Welcome to my Devops Dashboard</h1>
      <h2>You&pos;re currently viewing metrics for this project</h2>
      <h2>
        Login on <Link href={"/login"}>Dashboard</Link> to connect your own project instead
      </h2>
      <Charts workflowRuns={projectWorkflowRuns} />
      <WorkflowUpdatesProvider>
        <WorkflowRuns runs={projectWorkflowRuns} project="/project" />
      </WorkflowUpdatesProvider>
    </div>
  );
}
