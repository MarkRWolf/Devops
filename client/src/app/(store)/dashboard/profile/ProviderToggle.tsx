// ./client/src/app/(store)/dashboard/ProviderToggle.tsx
"use client";

import { ReactNode } from "react";

export default function ProviderToggle({
  title,
  icon,
  configured,
  onClick,
}: {
  title: string;
  icon: ReactNode;
  configured: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-3 rounded border transition-colors cursor-pointer ${
        configured ? "border-chart-2" : "border-border"
      } hover:bg-muted`}
      aria-pressed={configured}
    >
      {icon}
    </button>
  );
}
