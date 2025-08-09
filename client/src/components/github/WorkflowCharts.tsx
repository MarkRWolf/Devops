"use client";

import ChartCard from "@/components/ci/charts/ChartCard";
import Chart from "@/components/ci/charts/Chart";
import useChartTextColor from "@/components/ci/charts/useChartTextColor";
import { partitionRuns, buildSuccessSeries, buildDurationSeries } from "@/lib/github/stats";
import type { GitHubWorkflowRun } from "@/lib/github/models";
import type { ChartOptions } from "chart.js";

export default function WorkflowCharts({ workflowRuns }: { workflowRuns: GitHubWorkflowRun[] }) {
  const textColor = useChartTextColor();
  if (!workflowRuns?.length) return null;

  const { success, failed } = partitionRuns(workflowRuns);

  // Status pie
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
        labels: { color: textColor, font: { size: 14 } },
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
    },
  };

  // Success trend
  const succSeries = buildSuccessSeries(workflowRuns);
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
        labels: { color: textColor, font: { size: 14 } },
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
    },
    scales: { y: { min: 0, max: 120, ticks: { callback: (v) => v + "%" } } },
  };

  // Branch pie (top 5 + Other)
  const branchCounts = workflowRuns.reduce<Record<string, number>>((acc, r) => {
    const br = r.head_branch || "unknown";
    acc[br] = (acc[br] || 0) + 1;
    return acc;
  }, {});
  const sortedBranches = Object.entries(branchCounts).sort((a, b) => b[1] - a[1]);
  const top = sortedBranches.slice(0, 5);
  const others = sortedBranches.slice(5).reduce((n, [, c]) => n + c, 0);
  if (others) top.push(["Other", others]);
  const branchData = {
    labels: top.map(([l]) => l),
    datasets: [
      {
        data: top.map(([, n]) => n),
        backgroundColor: ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#64748b"],
        borderWidth: 0,
      },
    ],
  };
  const branchOpts: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor, font: { size: 14 } },
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
    },
  };

  // Duration trend (ms -> s)
  const durSeries = buildDurationSeries(workflowRuns).map((p) => ({ x: p.x, y: p.y / 1000 }));
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
        labels: { color: textColor, font: { size: 14 } },
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}s` } },
    },
    scales: { y: { ticks: { callback: (v) => `${v}s` } } },
  };

  // Event type bar
  const eventCounts = workflowRuns.reduce<Record<string, number>>((acc, r) => {
    const ev = r.event || "unknown";
    acc[ev] = (acc[ev] || 0) + 1;
    return acc;
  }, {});
  const eventLabels = Object.keys(eventCounts);
  const eventData = {
    labels: eventLabels,
    datasets: [
      {
        label: "Runs by Event",
        data: eventLabels.map((l) => eventCounts[l]),
        backgroundColor: eventLabels.map(() => "#3b82f6"),
      },
    ],
  };
  const eventOpts: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} runs` } },
    },
    scales: {
      x: { ticks: { color: textColor } },
      y: { ticks: { color: textColor }, beginAtZero: true },
    },
  };

  const charts = [
    {
      key: "status",
      kind: "pie" as const,
      title: "Build/Deploys to ACA",
      data: statusData,
      options: statusOpts,
    },
    {
      key: "succ",
      kind: "line" as const,
      title: "Success % Trend",
      data: succData,
      options: succOpts,
    },
    {
      key: "branch",
      kind: "pie" as const,
      title: "Runs by Branch",
      data: branchData,
      options: branchOpts,
    },
    {
      key: "dur",
      kind: "line" as const,
      title: "Run Duration Trend",
      data: durData,
      options: durOpts,
    },
    {
      key: "event",
      kind: "bar" as const,
      title: "Runs by Event Type",
      data: eventData,
      options: eventOpts,
    },
  ];

  return (
    <div className="py-6">
      <h2 className="text-2xl font-semibold mb-8 text-center">Workflow Charts</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 justify-items-center gap-6 gap-y-12">
        {charts.map((c) => (
          <ChartCard key={c.key}>
            <Chart kind={c.kind} title={c.title} data={c.data} options={c.options} />
          </ChartCard>
        ))}
      </div>
    </div>
  );
}
