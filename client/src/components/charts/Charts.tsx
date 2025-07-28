// components/charts/Charts.tsx
"use client";
import { GitHubWorkflowRun } from "@/lib/github/models";
import { partitionRuns } from "@/lib/github/stats";
import { WorkflowStatusPie } from "../github/charts/WorkflowStatusPie";
import { WorkflowSuccessTrend } from "../github/charts/WorkflowSuccessTrend";
import React from "react";
import { useTheme } from "next-themes";

const Charts = ({ workflowRuns }: { workflowRuns?: GitHubWorkflowRun[] }) => {
  const { resolvedTheme } = useTheme();

  if (!workflowRuns?.length) return null;

  const { success: successRuns, failed: failedRuns } = partitionRuns(workflowRuns);
  const textColor = resolvedTheme === "dark" ? "hsl(240, 6%, 90%)" : "hsl(240, 6%, 10%)";
  const workflowCharts: React.JSX.Element[] = [
    <WorkflowStatusPie
      textColor={textColor}
      key="status-pie"
      success={successRuns.length}
      failed={failedRuns.length}
    />,
    <WorkflowSuccessTrend textColor={textColor} key="success-trend" runs={workflowRuns} />,
  ];

  return (
    <div className="container-main py-6">
      <h2 className="text-2xl font-semibold mb-8 text-center">Charts</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 justify-items-center max-w-screen-md mx-auto">
        {workflowCharts.map((chart) => (
          <div
            key={chart.key}
            className="bg-card py-8 flex items-center rounded-2xl shadow-lg w-full"
          >
            {chart}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Charts;
