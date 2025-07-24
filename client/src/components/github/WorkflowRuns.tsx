import { GitHubWorkflowRun } from "@/lib/github/models";
import WorkflowRunDetails from "./WorkflowRunDetails";

interface WorkflowRunsProps {
  runs: GitHubWorkflowRun[];
  project?: string;
}

const WorkflowRuns = async ({ runs, project = "" }: WorkflowRunsProps) => {
  return (
    <>
      {runs.length > 0 && (
        <div className="max-w-5xl mx-auto py-4 px-8 border space-y-2">
          <h2 className="text-lg font-semibold mb-4">Latest Project Workflow Runs:</h2>
          <ul className="space-y-4">
            {runs.map((run) => (
              <li key={run.id} className="bg-white">
                <WorkflowRunDetails run={run} urlInsert={project} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {runs.length === 0 && <p>No project workflow runs found or configured.</p>}
    </>
  );
};

export default WorkflowRuns;
