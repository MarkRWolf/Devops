// components/github/charts/WorkflowSuccessTrend.tsx
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
import { buildSuccessSeries } from "@/lib/github/stats";
import { GitHubWorkflowRun } from "@/lib/github/models";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export function WorkflowSuccessTrend({ runs }: { runs: GitHubWorkflowRun[] }) {
  const points = buildSuccessSeries(runs);

  const data = {
    labels: points.map((p) => p.x),
    datasets: [
      {
        label: "Success %",
        data: points.map((p) => p.y),
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: { y: { min: 0, grace: "5%", ticks: { callback: (v) => v + "%" } } },
  };

  return (
    <div className="aspect-video w-full">
      <Line data={data} options={options} />
    </div>
  );
}
