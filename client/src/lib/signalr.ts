// client/src/lib/signalr.ts
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

let hub: ReturnType<HubConnectionBuilder["build"]> | null = null;

export function getWorkflowHub() {
  if (!hub && typeof window !== "undefined") {
    hub = new HubConnectionBuilder()
      .withUrl("/WS/workflowHub", { withCredentials: true })
      .configureLogging(LogLevel.Information)
      .build();
  }
  return hub!;
}
