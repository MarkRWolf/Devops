"use client";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export function WorkflowStatusPie({ success, failed }: { success: number; failed: number }) {
  const data = {
    labels: ["Succeeded", "Failed"],
    datasets: [
      {
        data: [success, failed],
        backgroundColor: ["#22c55e", "#ef4444"],
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
        onHover: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "pointer"),
        onLeave: (_e, _item, legend) =>
          ((legend.chart.canvas as HTMLCanvasElement).style.cursor = "default"),
      },
    },
  };

  return (
    <div className="aspect-square w-full">
      <Pie data={data} options={options} />
    </div>
  );
}
