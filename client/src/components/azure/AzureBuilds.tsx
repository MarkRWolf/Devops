// ./client/src/components/azure/AzureBuilds.tsx
"use client";
import { AzureBuild } from "@/lib/azure/models";
import AzureBuildDetails from "./AzureBuildDetails";

export default function AzureBuilds({
  builds,
  project = "",
}: {
  builds: AzureBuild[];
  project?: string;
}) {
  if (!builds?.length) return <p>No Azure builds found or configured.</p>;
  return (
    <div className="container-main py-6">
      <h2 className="text-2xl font-semibold mb-8 text-center">Azure DevOps Builds</h2>
      <div className="max-w-7xl mx-auto py-4 px-8 border space-y-2">
        <h2 className="text-lg font-semibold mb-4">Latest Builds:</h2>
        <div className="flex flex-col gap-4">
          {builds.map((b) => (
            <AzureBuildDetails key={b.id} build={b} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
