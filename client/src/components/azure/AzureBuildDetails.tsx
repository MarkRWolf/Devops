// ./client/src/components/azure/AzureBuildDetails.tsx
"use client";

import ExpandablePanel from "@/components/common/ExpandablePanel";
import { useCiData } from "../ci/details/useCiData";
import { AzureArtifact, AzureBuild, AzureJob } from "@/lib/azure/models";
import { formatDateTime } from "@/lib/helpers/date";
import { Button } from "@/components/ui/button";

export default function AzureBuildDetails({
  build,
  project = "",
}: {
  build: AzureBuild;
  project?: string;
}) {
  const baseUrl = `/api/azure${project}/builds/${build.id}`;

  const { jobs, artifacts, loading, err, load } = useCiData<AzureJob, AzureArtifact>({
    baseUrl,
    jobsEndpoint: "timeline",
    artifactsEndpoint: "artifacts",
    extractJobs: (json) => {
      const j = json as { records?: AzureJob[] } | AzureJob[];
      return Array.isArray(j) ? j : j.records ?? [];
    },
    extractArtifacts: (json) => {
      const a = json as { value?: AzureArtifact[] } | AzureArtifact[];
      return Array.isArray(a) ? a : a.value ?? [];
    },
  });

  const title = build.buildNumber ?? `Build #${build.id}`;
  const subtitle = (
    <>
      Status:{" "}
      <span className="font-medium">
        {build.status ?? "n/a"} ({build.result ?? "n/a"})
      </span>
    </>
  );
  const meta = `Queued: ${formatDateTime(build.queueTime)}`;

  return (
    <ExpandablePanel title={title} subtitle={subtitle} meta={meta} onExpand={load}>
      {loading ? (
        <p className="text-center text-muted-foreground">Loading…</p>
      ) : err ? (
        <p className="text-center text-destructive">{err}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-semibold">Jobs</h4>
              <span className="text-xs text-muted-foreground">{jobs?.length ?? 0}</span>
            </div>
            <div className="rounded-md border bg-muted/30 p-3 max-h-64 md:max-h-80 overflow-auto">
              {jobs && jobs.length ? (
                <ul className="space-y-1 text-xs md:text-sm">
                  {jobs.map((j) => (
                    <li key={j.id} className="leading-snug">
                      <span className="font-medium">{j.name ?? j.id}</span> — {j.state ?? "n/a"} (
                      {j.result ?? "n/a"})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No jobs found.</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-semibold">Artifacts</h4>
              <span className="text-xs text-muted-foreground">{artifacts?.length ?? 0}</span>
            </div>
            <div className="rounded-md border bg-muted/30 p-3 max-h-64 md:max-h-80 overflow-auto">
              {artifacts && artifacts.length ? (
                <ul className="space-y-1 text-xs md:text-sm">
                  {artifacts.map((a) => (
                    <li key={a.name} className="flex items-center justify-between gap-2">
                      <span className="truncate">{a.name}</span>
                      {a.resource?.downloadUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1 text-blue-500"
                          onClick={() => window.open(a.resource!.downloadUrl!, "_blank")}
                        >
                          Download
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No artifacts found.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </ExpandablePanel>
  );
}
