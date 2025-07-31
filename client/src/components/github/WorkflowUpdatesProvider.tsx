// client/src/components/github/WorkflowUpdatesProvider.tsx
"use client";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { HubConnectionState } from "@microsoft/signalr";
import { getWorkflowHub } from "@/lib/signalr";
import { GitHubWorkflowRun } from "@/lib/github/models";

// Context provides runs that are socketed after initial render
type UpdatesContext = { socketedRuns: GitHubWorkflowRun[] };

const WorkflowUpdatesContext = createContext<UpdatesContext | undefined>(undefined);

export function WorkflowUpdatesProvider({ children }: { children: ReactNode }) {
  const [socketedRuns, setSocketedRuns] = useState<GitHubWorkflowRun[]>([]);

  useEffect(() => {
    const hub = getWorkflowHub();

    if (hub.state === HubConnectionState.Disconnected) {
      hub.start().catch(console.error);
    }

    const onReceive = (newRunUpdate: GitHubWorkflowRun) => {
      setSocketedRuns((prevSocketedRuns) => {
        const existingIndex = prevSocketedRuns.findIndex((run) => run.id === newRunUpdate.id);

        if (existingIndex !== -1) {
          const updatedList = [...prevSocketedRuns];
          updatedList[existingIndex] = newRunUpdate;
          return updatedList;
        } else {
          return [newRunUpdate, ...prevSocketedRuns];
        }
      });
    };

    hub.on("ReceiveWorkflowRun", onReceive);

    return () => {
      hub.off("ReceiveWorkflowRun", onReceive);
      if (hub.state !== HubConnectionState.Disconnected) {
        hub.stop();
      }
    };
  }, []);

  return (
    <WorkflowUpdatesContext.Provider value={{ socketedRuns }}>
      {children}
    </WorkflowUpdatesContext.Provider>
  );
}

export function useWorkflowUpdates() {
  const ctx = useContext(WorkflowUpdatesContext);
  if (!ctx) throw new Error("useWorkflowUpdates must be inside WorkflowUpdatesProvider");
  return ctx;
}
