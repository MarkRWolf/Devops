"use client";
import "./chartRegistry";
import { Pie, Line, Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

type Kind = "pie" | "line" | "bar";
type AnyData = ChartData<"pie"> | ChartData<"line"> | ChartData<"bar">;
type AnyOpts = ChartOptions<"pie"> | ChartOptions<"line"> | ChartOptions<"bar">;

export default function Chart({
  kind,
  title,
  data,
  options,
}: {
  kind: Kind;
  title: string;
  data: AnyData;
  options?: AnyOpts;
}) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center font-semibold mb-2">{title}</div>
      <div className="h-4/5">
        {kind === "pie" && (
          <Pie data={data as ChartData<"pie">} options={options as ChartOptions<"pie">} />
        )}
        {kind === "line" && (
          <Line data={data as ChartData<"line">} options={options as ChartOptions<"line">} />
        )}
        {kind === "bar" && (
          <Bar data={data as ChartData<"bar">} options={options as ChartOptions<"bar">} />
        )}
      </div>
    </div>
  );
}
