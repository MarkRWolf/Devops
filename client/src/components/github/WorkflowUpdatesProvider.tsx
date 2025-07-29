// client/src/components/github/WorkflowUpdatesProvider.tsx
"use client";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { getWorkflowHub } from "@/lib/signalr";
import { GitHubWorkflowRun } from "@/lib/github/models";

type UpdatesContext = { lastRun: GitHubWorkflowRun | null };

const WorkflowUpdatesContext = createContext<UpdatesContext | undefined>(undefined);

export function WorkflowUpdatesProvider({
  children,
  initialRun,
}: {
  children: ReactNode;
  initialRun?: GitHubWorkflowRun;
}) {
  const [lastRun, setLastRun] = useState<GitHubWorkflowRun | null>(initialRun ?? null);

  useEffect(() => {
    const hub = getWorkflowHub();
    hub.start().catch(console.error);
    const onReceive = (run: GitHubWorkflowRun) => setLastRun(run);
    hub.on("ReceiveWorkflowRun", onReceive);
    return () => {
      hub.off("ReceiveWorkflowRun", onReceive);
      hub.stop();
    };
  }, []);

  return (
    <WorkflowUpdatesContext.Provider value={{ lastRun }}>
      {children}
    </WorkflowUpdatesContext.Provider>
  );
}

export function useWorkflowUpdates() {
  const ctx = useContext(WorkflowUpdatesContext);
  if (!ctx) throw new Error("useWorkflowUpdates must be inside WorkflowUpdatesProvider");
  return ctx;
}
