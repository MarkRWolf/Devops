// client/src/components/WorkflowUpdates.tsx
"use client";
import { useEffect, useState } from "react";
import { getWorkflowHub } from "@/lib/signalr";
import { GitHubWorkflowRun } from "@/lib/github/models";

export default function WorkflowUpdates() {
  const [lastRun, setLastRun] = useState<GitHubWorkflowRun | null>(null);

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

  return lastRun ? (
    <pre>{JSON.stringify(lastRun, null, 2)}</pre>
  ) : (
    <p>Waiting for workflow updates…</p>
  );
}
