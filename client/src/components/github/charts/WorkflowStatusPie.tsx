"use client";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export function WorkflowStatusPie({
  success,
  failed,
  textColor,
}: {
  success: number;
  failed: number;
  textColor: string;
}) {
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
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="text-center font-semibold mb-2">Build/Deploys to ACA</div>
      <div className="h-4/5">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}
