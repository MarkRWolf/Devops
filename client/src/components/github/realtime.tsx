"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { HubConnectionState } from "@microsoft/signalr";
import { getWorkflowHub } from "@/lib/signalr";
import { GitHubWorkflowRun } from "@/lib/github/models";

type UpdatesContext = {
  socketedRuns: GitHubWorkflowRun[];
  state: HubConnectionState;
};

const Ctx = createContext<UpdatesContext | undefined>(undefined);

export function WorkflowUpdatesProvider({ children }: { children: ReactNode }) {
  const [socketedRuns, setSocketedRuns] = useState<GitHubWorkflowRun[]>([]);
  const [state, setState] = useState<HubConnectionState>(HubConnectionState.Disconnected);

  useEffect(() => {
    const hub = getWorkflowHub();

    const updateState = () => setState(hub.state);

    if (hub.state === HubConnectionState.Disconnected) {
      hub.start().finally(updateState);
    } else {
      updateState();
    }

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
    hub.onreconnected(updateState);
    hub.onreconnecting(updateState);
    hub.onclose(updateState);

    return () => {
      hub.off("ReceiveWorkflowRun", onReceive);
      if (hub.state !== HubConnectionState.Disconnected) {
        hub.stop().catch(console.error);
      }
    };
  }, []);

  return <Ctx.Provider value={{ socketedRuns, state }}>{children}</Ctx.Provider>;
}

export function useWorkflowUpdates() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkflowUpdates must be used within WorkflowUpdatesProvider");
  return ctx;
}
