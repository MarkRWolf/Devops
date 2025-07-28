// File: client/src/components/github/charts/WorkflowDurationTrend.tsx
"use client";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Chart as ChartJS,
  ChartOptions,
} from "chart.js";
import { buildDurationSeries } from "@/lib/github/stats";
import { GitHubWorkflowRun } from "@/lib/github/models";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function WorkflowDurationTrend({
  runs,
  textColor,
}: {
  runs: GitHubWorkflowRun[];
  textColor: string;
}) {
  const raw = buildDurationSeries(runs);
  const points = raw.map((p) => ({ x: p.x, y: p.y / 1000 }));

  const data = {
    labels: points.map((p) => p.x),
    datasets: [
      {
        label: "Duration (s)",
        data: points.map((p) => p.y),
        tension: 0.3,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.2)",
        pointBackgroundColor: "#f59e0b",
        pointBorderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor, font: { size: 14 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y}s`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (val) => `${val}s`,
        },
      },
    },
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center font-semibold mb-2">Run Duration Trend</div>
      <div className="h-4/5">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
