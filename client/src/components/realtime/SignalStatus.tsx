// client/src/components/realtime/SignalStatus.tsx
"use client";

import { HubConnectionState } from "@microsoft/signalr";
import { useWorkflowUpdates } from "@/components/github/realtime";

function labelFor(state: HubConnectionState) {
  switch (state) {
    case HubConnectionState.Connected:
      return "On";
    case HubConnectionState.Connecting:
      return "Connecting";
    case HubConnectionState.Reconnecting:
      return "Reconnecting";
    default:
      return "Off";
  }
}

function dotClass(state: HubConnectionState) {
  if (state === HubConnectionState.Connected) return "bg-emerald-500";
  if (state === HubConnectionState.Connecting || state === HubConnectionState.Reconnecting)
    return "bg-amber-400";
  return "bg-rose-500";
}

export default function SignalStatus({ className = "" }: { className?: string }) {
  const { state, scope } = useWorkflowUpdates();
  const label = labelFor(state);
  const dot = dotClass(state);

  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full border bg-background/70 text-xs ${className}`}
      title={`SignalR: ${label} • scope=${scope}`}
    >
      <span className="relative flex size-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-75`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>
      <span className="text-muted-foreground">Realtime:</span>
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">for:</span>
      <span className="font-medium">{scope}</span>
    </span>
  );
}
