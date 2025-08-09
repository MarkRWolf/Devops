// ./client/src/components/charts/ChartCard.tsx
"use client";
export default function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-8 bg-card flex items-center rounded-2xl shadow-lg w-full">{children}</div>
  );
}
