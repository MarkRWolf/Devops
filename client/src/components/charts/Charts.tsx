// components/charts/Charts.tsx
"use client";
import { GitHubWorkflowRun } from "@/lib/github/models";
import { partitionRuns } from "@/lib/github/stats";
import { WorkflowStatusPie } from "../github/charts/WorkflowStatusPie";
import { WorkflowSuccessTrend } from "../github/charts/WorkflowSuccessTrend";

const Charts = ({ workflowRuns }: { workflowRuns?: GitHubWorkflowRun[] }) => {
  if (!workflowRuns?.length) return null;

  const { success: successRuns, failed: failedRuns } = partitionRuns(workflowRuns);

  return (
    <div className="container-main py-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-card p-6 rounded-2xl shadow-lg">
          <div className="aspect-square w-full">
            <WorkflowStatusPie success={successRuns.length} failed={failedRuns.length} />
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl shadow-lg">
          <div className="aspect-video w-full">
            <WorkflowSuccessTrend runs={workflowRuns} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
