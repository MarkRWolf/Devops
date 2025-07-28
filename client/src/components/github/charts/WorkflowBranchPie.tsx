// File: client/src/components/github/charts/WorkflowBranchPie.tsx
"use client";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from "chart.js";
import { GitHubWorkflowRun } from "@/lib/github/models";

ChartJS.register(ArcElement, Tooltip, Legend);

export function WorkflowBranchPie({
  runs,
  textColor,
}: {
  runs: GitHubWorkflowRun[];
  textColor: string;
}) {
  const counts = runs.reduce<Record<string, number>>((acc, r) => {
    const br = r.head_branch || "unknown";
    acc[br] = (acc[br] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 5);
  const othersCount = entries.slice(5).reduce((sum, [, c]) => sum + c, 0);
  if (othersCount) top.push(["Other", othersCount]);

  const labels = top.map((e) => e[0]);
  const data = {
    labels,
    datasets: [
      {
        data: top.map((e) => e[1]),
        backgroundColor: ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#64748b"],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor, font: { size: 14 } },
      },
    },
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center font-semibold mb-2">Runs by Branch</div>
      <div className="h-4/5">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}
