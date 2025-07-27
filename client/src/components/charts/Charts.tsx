// components/charts/Charts.tsx
"use client";
import { GitHubWorkflowRun } from "@/lib/github/models";
import { partitionRuns } from "@/lib/github/stats";
import { WorkflowStatusPie } from "../github/charts/WorkflowStatusPie";
import { WorkflowSuccessTrend } from "../github/charts/WorkflowSuccessTrend";
import React from "react";

const Charts = ({ workflowRuns }: { workflowRuns?: GitHubWorkflowRun[] }) => {
  if (!workflowRuns?.length) return null;

  const { success: successRuns, failed: failedRuns } = partitionRuns(workflowRuns);

  const workflowCharts: React.JSX.Element[] = [
    <WorkflowStatusPie key="status-pie" success={successRuns.length} failed={failedRuns.length} />,
    <WorkflowSuccessTrend key="success-trend" runs={workflowRuns} />,
  ];

  return (
    <div className="container-main py-6">
      <h2 className="text-2xl font-semibold mb-4">Charts</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-center max-w-screen-md mx-auto">
        {workflowCharts.map((chart) => (
          <div
            key={chart.key}
            className="bg-card p-4 flex items-center rounded-2xl shadow-lg w-full max-w-sm"
          >
            {chart}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Charts;
