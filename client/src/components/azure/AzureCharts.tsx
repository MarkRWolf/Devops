"use client";

import ChartCard from "@/components/ci/charts/ChartCard";
import Chart from "@/components/ci/charts/Chart";
import useChartTextColor from "@/components/ci/charts/useChartTextColor";
import { AzureBuild } from "@/lib/azure/models";
import { partitionBuilds, buildDurationSeries, buildSuccessSeries } from "@/lib/azure/stats";
import type { ChartOptions } from "chart.js";

export default function AzureCharts({ builds }: { builds: AzureBuild[] }) {
  const textColor = useChartTextColor();
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
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor },
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
    },
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
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor },
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
    },
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
      legend: {
        position: "bottom",
        labels: { color: textColor },
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}s` } },
    },
  };

  const charts = [
    {
      key: "az-status",
      kind: "pie" as const,
      title: "Azure Builds: Success vs Failed",
      data: statusData,
      options: statusOpts,
    },
    {
      key: "az-success",
      kind: "line" as const,
      title: "Azure Success Trend",
      data: succData,
      options: succOpts,
    },
    {
      key: "az-duration",
      kind: "line" as const,
      title: "Azure Duration Trend",
      data: durData,
      options: durOpts,
    },
  ];

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-8 text-center">Azure Charts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center gap-2 gap-y-12">
        {charts.map((c) => (
          <ChartCard key={c.key}>
            <Chart kind={c.kind} title={c.title} data={c.data} options={c.options} />
          </ChartCard>
        ))}
      </div>
    </div>
  );
}
