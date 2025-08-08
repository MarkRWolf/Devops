// File: client/src/components/github/WorkflowCharts.tsx
"use client";

import React from "react";
import { useTheme } from "next-themes";
import { WorkflowBranchPie } from "./charts/WorkflowBranchPie";
import { WorkflowDurationTrend } from "./charts/WorkflowDurationTrend";
import { WorkflowEventBar } from "./charts/WorkflowEventBar";
import { WorkflowSuccessTrend } from "./charts/WorkflowSuccessTrend";
import { WorkflowStatusPie } from "./charts/WorkflowStatusPie";
import { partitionRuns } from "@/lib/github/stats";
import { GitHubWorkflowRun } from "@/lib/github/models";

interface WorkflowChartsProps {
  workflowRuns: GitHubWorkflowRun[];
}

export default function WorkflowCharts({ workflowRuns }: WorkflowChartsProps) {
  const { resolvedTheme } = useTheme();
  const textColor = resolvedTheme === "dark" ? "hsl(240,6%,90%)" : "hsl(240,6%,10%)";
  const { success, failed } = partitionRuns(workflowRuns);

  const elements = [
    <WorkflowStatusPie
      key="status-pie"
      success={success.length}
      failed={failed.length}
      textColor={textColor}
    />,
    <WorkflowSuccessTrend key="success-trend" runs={workflowRuns} textColor={textColor} />,
    <WorkflowBranchPie key="branch-pie" runs={workflowRuns} textColor={textColor} />,
    <WorkflowDurationTrend key="duration-trend" runs={workflowRuns} textColor={textColor} />,
    // <WorkflowEventBar key="event-bar" runs={workflowRuns} textColor={textColor} />,
  ];

  return elements.map((el) => (
    <div key={el.key} className="py-8 bg-card flex items-center rounded-2xl shadow-lg">
      {el}
    </div>
  ));
}
