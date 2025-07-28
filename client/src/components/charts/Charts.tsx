// components/charts/Charts.tsx
"use client";

import { GitHubWorkflowRun } from "@/lib/github/models";
import WorkflowCharts from "../github/WorkflowCharts";

const Charts = ({ workflowRuns }: { workflowRuns?: GitHubWorkflowRun[] }) => {
  if (!workflowRuns?.length) return null;

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-8 text-center">Charts</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center gap-2 gap-y-12">
        <WorkflowCharts workflowRuns={workflowRuns} />
      </div>
    </div>
  );
};

export default Charts;
