// ./client/src/components/github/realtime.tsx
"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { HubConnectionState } from "@microsoft/signalr";
import { getWorkflowHub } from "@/lib/signalr";
import { GitHubWorkflowRun } from "@/lib/github/models";

type UpdatesContext = { socketedRuns: GitHubWorkflowRun[] };
const Ctx = createContext<UpdatesContext | undefined>(undefined);

export function WorkflowUpdatesProvider({ children }: { children: ReactNode }) {
  const [socketedRuns, setSocketedRuns] = useState<GitHubWorkflowRun[]>([]);

  useEffect(() => {
    const hub = getWorkflowHub();
    if (hub.state === HubConnectionState.Disconnected) hub.start().catch(console.error);

    const onReceive = (incoming: GitHubWorkflowRun) => {
      setSocketedRuns((prev) => {
        const ix = prev.findIndex((r) => r.id === incoming.id);
        if (ix >= 0) {
          const next = [...prev];
          next[ix] = incoming;
          return next;
        }
        return [incoming, ...prev];
      });
    };

    hub.on("ReceiveWorkflowRun", onReceive);
    return () => {
      hub.off("ReceiveWorkflowRun", onReceive);
      if (hub.state !== HubConnectionState.Disconnected) hub.stop();
    };
  }, []);

  return <Ctx.Provider value={{ socketedRuns }}>{children}</Ctx.Provider>;
}

export function useWorkflowUpdates() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkflowUpdates must be used within WorkflowUpdatesProvider");
  return ctx;
}
