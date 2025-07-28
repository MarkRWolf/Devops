// File: client/src/components/github/charts/WorkflowEventBar.tsx
"use client";
import { Bar } from "react-chartjs-2";
import {
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Chart as ChartJS,
  ChartOptions,
} from "chart.js";
import { GitHubWorkflowRun } from "@/lib/github/models";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function WorkflowEventBar({
  runs,
  textColor,
}: {
  runs: GitHubWorkflowRun[];
  textColor: string;
}) {
  const counts = runs.reduce<Record<string, number>>((acc, r) => {
    const ev = r.event || "unknown";
    acc[ev] = (acc[ev] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(counts);
  const data = {
    labels,
    datasets: [
      {
        label: "Runs by Event",
        data: labels.map((l) => counts[l]),
        backgroundColor: labels.map(() => "#3b82f6"),
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} runs`,
        },
      },
    },
    scales: {
      x: { ticks: { color: textColor } },
      y: {
        ticks: { color: textColor },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center font-semibold mb-2">Runs by Event Type</div>
      <div className="h-4/5">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
