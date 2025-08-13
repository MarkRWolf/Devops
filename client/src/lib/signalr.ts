import {
  HubConnectionBuilder,
  LogLevel,
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";

type Entry = {
  hub: HubConnection;
  refs: number;
  starting?: Promise<void>;
  stopTimer?: ReturnType<typeof setTimeout> | null;
};

const registry = new Map<string, Entry>();

async function getHubToken() {
  const base = process.env.NEXT_PUBLIC_WS_URL || "";
  const r = await fetch(`${base}/API/auth/hub-token`, { credentials: "include" });
  if (!r.ok) return "";
  const { token } = await r.json();
  return token as string;
}

function build(scope: string) {
  const base = process.env.NEXT_PUBLIC_WS_URL || "";
  const url = `${base}/WS/workflowHub?scope=${encodeURIComponent(scope)}`;
  return new HubConnectionBuilder()
    .withUrl(url, {
      withCredentials: true,
      accessTokenFactory: scope === "demo" ? undefined : async () => (await getHubToken()) || "",
    })
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
  if (!entry.starting)
    entry.starting = entry.hub.start().finally(() => {
      entry.starting = undefined;
    });
  return entry.starting;
}
