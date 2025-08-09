// client/src/components/sections/CIMetrics.tsx
"use client";

import type { ReactNode } from "react";
import type { GitHubWorkflowRun } from "@/lib/github/models";
import type { AzureBuild } from "@/lib/azure/models";
import { WorkflowUpdatesProvider } from "@/components/github/realtime";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import WorkflowCharts from "@/components/github/WorkflowCharts";
import AzureBuilds from "@/components/azure/AzureBuilds";
import AzureCharts from "@/components/azure/AzureCharts";

type CI = "gh" | "az";
type View = "runs" | "charts";

export default function CIMetrics({
  workflowRuns,
  azureBuilds,
  project = "",
  ci,
  view,
}: {
  workflowRuns?: GitHubWorkflowRun[];
  azureBuilds?: AzureBuild[];
  project?: string;
  ci?: CI;
  view?: View;
}) {
  const hasGh = !!workflowRuns?.length;
  const hasAz = !!azureBuilds?.length;

  const layout: Record<CI, Record<View, ReactNode[]>> = {
    gh: {
      runs: hasGh
        ? [
            <WorkflowUpdatesProvider key="gh-runs">
              <WorkflowRuns runs={workflowRuns!} project={project} />
            </WorkflowUpdatesProvider>,
          ]
        : [],
      charts: hasGh ? [<WorkflowCharts key="gh-charts" workflowRuns={workflowRuns!} />] : [],
    },
    az: {
      runs: hasAz ? [<AzureBuilds key="az-runs" builds={azureBuilds!} project={project} />] : [],
      charts: hasAz ? [<AzureCharts key="az-charts" builds={azureBuilds!} />] : [],
    },
  };

  const providers = ci ? [ci] : (["gh", "az"] as CI[]);
  const views = view ? [view] : (["charts", "runs"] as View[]);

  const content = providers.flatMap((p) => views.flatMap((v) => layout[p][v]));

  return <div className="w-full">{content}</div>;
}
