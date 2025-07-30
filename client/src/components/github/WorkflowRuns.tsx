"use client";
import { GitHubWorkflowRun } from "@/lib/github/models";
import WorkflowRunDetails from "./WorkflowRunDetails";
import { useWorkflowUpdates, WorkflowUpdatesProvider } from "./WorkflowUpdatesProvider";
import { baseUrl } from "@/lib/settings";

interface WorkflowRunsProps {
  runs: GitHubWorkflowRun[];
  project?: string;
}

const WorkflowRuns = ({ runs, project = "" }: WorkflowRunsProps) => {
  const { lastRun } = useWorkflowUpdates();
  const merged = lastRun && lastRun.id !== runs[0]?.id ? [lastRun, ...runs] : runs;
  console.log("baseUrl", baseUrl);

  return (
    <WorkflowUpdatesProvider initialRun={runs[0]}>
      <div className="container-main py-6">
        <h2 className="text-2xl font-semibold mb-8 text-center">Workflow Runs</h2>
        {merged.length > 0 ? (
          <div className="max-w-7xl mx-auto py-4 px-8 border space-y-2">
            <h2 className="text-lg font-semibold mb-4">Latest Project Workflow Runs:</h2>
            <div className="flex flex-col gap-4">
              {merged.map((run) => (
                <WorkflowRunDetails key={run.id} run={run} urlInsert={project} />
              ))}
            </div>
          </div>
        ) : (
          <p>No project workflow runs found or configured.</p>
        )}
      </div>
    </WorkflowUpdatesProvider>
  );
};

export default WorkflowRuns;
