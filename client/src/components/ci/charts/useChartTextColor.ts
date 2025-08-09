// ./client/src/components/charts/useChartTextColor.ts
"use client";
import { useTheme } from "next-themes";

export default function useChartTextColor() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? "hsl(240,6%,90%)" : "hsl(240,6%,10%)";
}
