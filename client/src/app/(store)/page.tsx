// client/src/app/(store)/page.tsx
export const dynamic = "force-dynamic";

import WorkflowRuns from "@/components/github/WorkflowRuns";
import { fetchWorkflowRuns } from "@/lib/github/helpers";
import Charts from "@/components/charts/Charts";
import { WorkflowUpdatesProvider } from "@/components/github/WorkflowUpdatesProvider";
import AzureCharts from "@/components/azure/AzureCharts";
import AzureBuilds from "@/components/azure/AzureBuilds";
import { fetchAzureBuilds } from "@/lib/azure/helpers";
import Link from "next/link";

export default async function Home() {
  const project = "/project";
  const [projectWorkflowRuns, projectAzureBuilds] = await Promise.all([
    fetchWorkflowRuns(project),
    fetchAzureBuilds(project),
  ]);

  return (
    <div className="flex flex-col items-center gap-2 mt-10">
      <h1 className="text-xl">Welcome to my Devops Dashboard</h1>
      <h2>You&apos;re currently viewing metrics for this project</h2>
      <h2>
        Login on{" "}
        <Link href={"/login"} className="underline">
          Dashboard
        </Link>{" "}
        to connect your own project
      </h2>
      {/* GitHub */}
      <Charts workflowRuns={projectWorkflowRuns} />
      <WorkflowUpdatesProvider>
        <WorkflowRuns runs={projectWorkflowRuns} project={project} />
      </WorkflowUpdatesProvider>

      {/* Azure */}
      <AzureCharts builds={projectAzureBuilds} />
      <AzureBuilds builds={projectAzureBuilds} project={project} />
    </div>
  );
}
