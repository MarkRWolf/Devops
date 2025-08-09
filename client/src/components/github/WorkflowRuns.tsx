// ./client/src/components/github/WorkflowRuns.tsx
"use client";
import { GitHubWorkflowRun } from "@/lib/github/models";
import WorkflowRunDetails from "./WorkflowRunDetails";
import { useWorkflowUpdates } from "./realtime";

export default function WorkflowRuns({
  runs,
  project = "",
}: {
  runs: GitHubWorkflowRun[];
  project?: string;
}) {
  const { socketedRuns } = useWorkflowUpdates();
  const out = [...runs];
  const pos = new Map(out.map((r, i) => [r.id, i] as const));
  /* This ensures existing runs are updated so socketed runs are only added if it didn't exist on SSR */
  for (let i = socketedRuns.length - 1; i >= 0; i--) {
    const s = socketedRuns[i];
    const idx = pos.get(s.id);
    if (idx !== undefined) out[idx] = s;
    else out.unshift(s);
  }

  const merged = out;
  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-8 text-center">Workflow Runs</h2>
      {merged.length ? (
        <div className="mx-auto py-4 px-8 border space-y-2">
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
  );
}
