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

export function WorkflowSuccessTrend({
  runs,
  textColor,
}: {
  runs: GitHubWorkflowRun[];
  textColor: string;
}) {
  const points = buildSuccessSeries(runs);

  const data = {
    labels: points.map((p) => p.x),
    datasets: [
      {
        label: "Success %",
        data: points.map((p) => p.y),
        tension: 0.4,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.2)",
        pointBackgroundColor: "#3B82F6",
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
        labels: {
          color: textColor,
          font: { size: 14 },
        },
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
    },
    scales: { y: { min: 0, max: 120, ticks: { callback: (v) => v + "%" } } },
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center font-semibold mb-2">Build/Deploys to ACA</div>
      <div className="h-4/5">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
