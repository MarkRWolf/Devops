"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div
      className="rounded-full w-[62px] bg-alt p-1 shadow-[inset_3px_3px_4px_rgba(128,128,128,0.07),inset_-3px_-3px_4px_rgba(128,128,128,0.07)] cursor-pointer"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      <div className="relative transition-all duration-300 dark:left-0 left-full dark:translate-x-0 -translate-x-full h-6 w-6 rounded-full bg-foreground/10">
        <Moon className="absolute inset-0 p-0.5  dark:opacity-100 opacity-0" />
        <Sun className="absolute inset-0 p-0.5 dark:opacity-0 opacity-100" />
      </div>
    </div>
  );
}
