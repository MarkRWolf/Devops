// ./client/src/components/azure/AzureBuilds.tsx
"use client";
import { AzureBuild } from "@/lib/azure/models";
import AzureBuildDetails from "./AzureBuildDetails";
import { useWorkflowUpdates } from "../github/realtime";

export default function AzureBuilds({
  builds,
  project = "",
}: {
  builds: AzureBuild[];
  project?: string;
}) {
  const { socketedAzure } = useWorkflowUpdates();

  if (!builds?.length) return <p>No Azure builds found or configured.</p>;
  const out = [...builds];
  const pos = new Map(out.map((b, i) => [b.id, i] as const));
  // Update existing builds or prepend new ones from the socket
  for (let i = socketedAzure.length - 1; i >= 0; i--) {
    const s = socketedAzure[i];
    const idx = pos.get(s.id);
    if (idx !== undefined) out[idx] = s;
    else out.unshift(s);
  }
  const merged = out;

  return (
    <div className="py-6">
      <div className="py-4 px-8 border space-y-2">
        <h2 className="text-lg font-semibold mb-4">Latest Builds:</h2>
        <div className="flex flex-col gap-4">
          {merged.map((b) => (
            <AzureBuildDetails key={b.id} build={b} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
