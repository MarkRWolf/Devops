// client/src/lib/signalr.ts
import {
  HubConnectionBuilder,
  LogLevel,
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";
import { proxyUrl } from "./settings";

type Entry = {
  hub: HubConnection;
  refs: number;
  starting?: Promise<void>;
  stopTimer?: ReturnType<typeof setTimeout> | null;
};

const registry = new Map<string, Entry>();

function build(scope: string) {
  const url = new URL(`${proxyUrl || ""}/WS/workflowHub`);
  url.searchParams.set("scope", scope);
  return new HubConnectionBuilder()
    .withUrl(url.toString(), { withCredentials: true })
    .configureLogging(LogLevel.Information)
    .build();
}

export function acquireHub(scope: string) {
  let entry = registry.get(scope);
  if (!entry) {
    entry = { hub: build(scope), refs: 0, starting: undefined, stopTimer: null };
    registry.set(scope, entry);
  }
  if (entry.stopTimer) {
    clearTimeout(entry.stopTimer);
    entry.stopTimer = null;
  }
  entry.refs += 1;
  return entry.hub;
}

export function releaseHub(scope: string) {
  const entry = registry.get(scope);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs > 0) return;
  entry.stopTimer = setTimeout(async () => {
    if (entry.refs === 0) {
      try {
        if (entry.hub.state !== HubConnectionState.Disconnected) await entry.hub.stop();
      } finally {
        registry.delete(scope);
      }
    }
  }, 5000);
}

export async function ensureStarted(scope: string) {
  const entry = registry.get(scope);
  if (!entry) return;
  if (
    entry.hub.state === HubConnectionState.Connected ||
    entry.hub.state === HubConnectionState.Connecting
  )
    return;
  if (!entry.starting) {
    entry.starting = entry.hub.start().finally(() => {
      entry.starting = undefined;
    });
  }
  return entry.starting;
}
