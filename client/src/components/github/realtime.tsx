"use client";

import { ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";
import { HubConnectionState, HubConnection } from "@microsoft/signalr";
import { acquireHub, ensureStarted, releaseHub } from "@/lib/signalr";
import { GitHubWorkflowRun } from "@/lib/ci/github/models";
import { AzureBuild } from "@/lib/azure/models";

type UpdatesContext = {
  socketedRuns: GitHubWorkflowRun[];
  socketedAzure: AzureBuild[];
  state: HubConnectionState;
  scope: string;
};

const Ctx = createContext<UpdatesContext | undefined>(undefined);

export function WorkflowUpdatesProvider({
  children,
  scope,
}: {
  children: ReactNode;
  scope?: string;
}) {
  const activeScope = scope || "user";
  const hubRef = useRef<HubConnection | null>(null);
  const [socketedRuns, setSocketedRuns] = useState<GitHubWorkflowRun[]>([]);
  const [socketedAzure, setSocketedAzure] = useState<AzureBuild[]>([]);
  const [state, setState] = useState<HubConnectionState>(HubConnectionState.Disconnected);

  useEffect(() => {
    const hub = acquireHub(activeScope);
    hubRef.current = hub;
    setSocketedRuns([]);
    setSocketedAzure([]);
    setState(hub.state);

    const onGh = (incoming: GitHubWorkflowRun) =>
      setSocketedRuns((prev) => {
        const ix = prev.findIndex((r) => r.id === incoming.id);
        if (ix >= 0) {
          const next = [...prev];
          next[ix] = incoming;
          return next;
        }
        return [incoming, ...prev];
      });

    const onAz = (incoming: AzureBuild) =>
      setSocketedAzure((prev) => {
        const i = prev.findIndex((b) => b.id === incoming.id);
        if (i >= 0) {
          const next = [...prev];
          next[i] = incoming;
          return next;
        }
        return [incoming, ...prev];
      });

    const onState = () => setState(hub.state);

    hub.on("ReceiveWorkflowRun", onGh);
    hub.on("ReceiveAzureBuild", onAz);
    hub.onreconnected(onState);
    hub.onreconnecting(onState);
    hub.onclose(onState);

    ensureStarted(activeScope)
      .catch(() => {})
      .finally(onState);

    return () => {
      hub.off("ReceiveWorkflowRun", onGh);
      hub.off("ReceiveAzureBuild", onAz);
      releaseHub(activeScope);
      hubRef.current = null;
    };
  }, [activeScope]);

  return (
    <Ctx.Provider value={{ socketedRuns, socketedAzure, state, scope: activeScope }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkflowUpdates() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkflowUpdates must be used within WorkflowUpdatesProvider");
  return ctx;
}
