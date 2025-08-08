// ./client/src/components/azure/AzureCharts.tsx
"use client";
import { useTheme } from "next-themes";
import { AzureBuild } from "@/lib/azure/models";
import { partitionBuilds, buildDurationSeries, buildSuccessSeries } from "@/lib/azure/stats";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartOptions,
} from "chart.js";
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

export default function AzureCharts({ builds }: { builds: AzureBuild[] }) {
  const { resolvedTheme } = useTheme();
  const textColor = resolvedTheme === "dark" ? "hsl(240,6%,90%)" : "hsl(240,6%,10%)";
  if (!builds?.length) return null;
  const { success, failed } = partitionBuilds(builds);

  const statusData = {
    labels: ["Succeeded", "Failed"],
    datasets: [
      {
        data: [success.length, failed.length],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };
  const statusOpts: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { color: textColor } } },
  };

  const succSeries = buildSuccessSeries(builds);
  const succData = {
    labels: succSeries.map((p) => p.x),
    datasets: [
      {
        label: "Success %",
        data: succSeries.map((p) => p.y),
        tension: 0.4,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.2)",
        borderWidth: 2,
      },
    ],
  };
  const succOpts: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { color: textColor } } },
    scales: { y: { min: 0, max: 120, ticks: { callback: (v) => v + "%" } } },
  };

  const durSeries = buildDurationSeries(builds).map((p) => ({ x: p.x, y: p.y / 1000 }));
  const durData = {
    labels: durSeries.map((p) => p.x),
    datasets: [
      {
        label: "Duration (s)",
        data: durSeries.map((p) => p.y),
        tension: 0.3,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.2)",
        borderWidth: 2,
      },
    ],
  };
  const durOpts: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: textColor } },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}s` } },
    },
  };

  const cards = [
    <div key="az-status" className="py-8 bg-card flex items-center rounded-2xl shadow-lg">
      <div className="w-full flex flex-col gap-4">
        <div className="text-center font-semibold mb-2">Azure Builds: Success vs Failed</div>
        <div className="h-4/5">
          <Pie data={statusData} options={statusOpts} />
        </div>
      </div>
    </div>,
    <div key="az-success" className="py-8 bg-card flex items-center rounded-2xl shadow-lg">
      <div className="w-full flex flex-col gap-4">
        <div className="text-center font-semibold mb-2">Azure Success Trend</div>
        <div className="h-4/5">
          <Line data={succData} options={succOpts} />
        </div>
      </div>
    </div>,
    <div key="az-duration" className="py-8 bg-card flex items-center rounded-2xl shadow-lg">
      <div className="w-full flex flex-col gap-4">
        <div className="text-center font-semibold mb-2">Azure Duration Trend</div>
        <div className="h-4/5">
          <Line data={durData} options={durOpts} />
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-8 text-center">Azure Charts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center gap-2 gap-y-12">
        {cards}
      </div>
    </div>
  );
}
