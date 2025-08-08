// ./client/src/components/azure/AzureBuildDetails.tsx
"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AzureBuild, AzureJob, AzureArtifact } from "@/lib/azure/models";
import { formatDateTime } from "@/lib/helpers/date";

export default function AzureBuildDetails({
  build,
  project = "",
}: {
  build: AzureBuild;
  project?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<AzureJob[] | null>(null);
  const [artifacts, setArtifacts] = useState<AzureArtifact[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const base = `/api/azure${project}/builds/${build.id}`;
      const [jobsRes, artsRes] = await Promise.all([
        fetch(`${base}/timeline`, { credentials: "include" }),
        fetch(`${base}/artifacts`, { credentials: "include" }),
      ]);
      if (!jobsRes.ok) throw new Error(await jobsRes.text());
      if (!artsRes.ok) throw new Error(await artsRes.text());
      const timeline = await jobsRes.json();
      const arts = await artsRes.json();
      setJobs(Array.isArray(timeline?.records) ? timeline.records : timeline);
      setArtifacts(Array.isArray(arts?.value) ? arts.value : arts);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load details");
      setJobs(null);
      setArtifacts(null);
    } finally {
      setLoading(false);
    }
  }, [build.id, project]);

  const toggle = () => {
    const nxt = !open;
    setOpen(nxt);
    if (nxt && jobs === null && artifacts === null) fetchDetails();
  };

  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm">
      <div className="flex justify-between items-center cursor-pointer" onClick={toggle}>
        <div>
          <h3 className="text-md font-semibold">{build.buildNumber ?? `Build #${build.id}`}</h3>
          <p className="text-sm text-secondary-foreground">
            Status:{" "}
            <span className="font-medium">
              {build.status ?? "n/a"} ({build.result ?? "n/a"})
            </span>
          </p>
          <p className="text-xs text-muted-foreground">Queued: {formatDateTime(build.queueTime)}</p>
        </div>
        <Button variant="ghost" size="sm">
          {open ? "Collapse" : "Expand"} <span className="ml-2">{open ? "−" : "+"}</span>
        </Button>
      </div>

      <div
        className={`transition-[max-height,opacity] duration-300 overflow-hidden ${
          open ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {open && (
          <div className="pt-4">
            {loading ? (
              <p className="text-center text-muted-foreground">Loading…</p>
            ) : err ? (
              <p className="text-center text-red-500">{err}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Jobs */}
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
                            <span className="font-medium">{j.name ?? j.id}</span> —{" "}
                            {j.state ?? "n/a"} ({j.result ?? "n/a"})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No jobs found.</p>
                    )}
                  </div>
                </section>

                {/* Artifacts */}
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
          </div>
        )}
      </div>
    </div>
  );
}
