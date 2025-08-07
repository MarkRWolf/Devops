// client/src/lib/signalr.ts
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { proxyUrl } from "./settings";

let hub: ReturnType<HubConnectionBuilder["build"]> | null = null;

export function getWorkflowHub() {
  if (!hub && typeof window !== "undefined") {
    hub = new HubConnectionBuilder()
      .withUrl(`${proxyUrl || ""}/WS/workflowHub`, { withCredentials: true })
      .configureLogging(LogLevel.Information)
      .build();
  }
  return hub!;
}
