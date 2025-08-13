// ./client/src/components/github/WorkflowRunDetails.tsx
"use client";

import ExpandablePanel from "@/components/common/ExpandablePanel";
import { useCiData } from "../ci/details/useCiData";
import { GitHubWorkflowRun, GitHubJob, GitHubArtifact } from "@/lib/ci/github/models";
import { formatDateTime } from "@/lib/helpers/date";
import { Button } from "@/components/ui/button";

export default function WorkflowRunDetails({
  run,
  urlInsert,
}: {
  run: GitHubWorkflowRun;
  urlInsert: string;
}) {
  const baseUrl = `/api/github${urlInsert}/workflows/runs/${run.id}`;

  const { jobs, artifacts, loading, err, load } = useCiData<GitHubJob, GitHubArtifact>({
    baseUrl,
    jobsEndpoint: "jobs",
    artifactsEndpoint: "artifacts",
    extractJobs: (json) => {
      const j = json as { jobs?: GitHubJob[] } | GitHubJob[];
      return Array.isArray(j) ? j : j.jobs ?? [];
    },
    extractArtifacts: (json) => {
      const a = json as { artifacts?: GitHubArtifact[] } | GitHubArtifact[];
      return Array.isArray(a) ? a : a.artifacts ?? [];
    },
  });

  const title = (
    <div className="flex items-center gap-2 min-w-0">
      <span className="truncate">{run.name}</span>
      {run.html_url && (
        <a
          href={run.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          View on GitHub
        </a>
      )}
    </div>
  );

  const subtitle = (
    <>
      Status:{" "}
      <span
        className={`font-medium ${
          run.conclusion === "success"
            ? "text-green-600"
            : run.conclusion === "failure"
            ? "text-red-600"
            : "text-yellow-600"
        }`}
      >
        {run.status} ({run.conclusion ?? "N/A"})
      </span>
    </>
  );

  const meta = `Run #${run.run_number} • ${formatDateTime(run.created_at)}`;

  return (
    <ExpandablePanel title={title} subtitle={subtitle} meta={meta} onExpand={load}>
      {loading ? (
        <p className="text-center text-muted-foreground">Loading…</p>
      ) : err ? (
        <p className="text-center text-destructive">{err}</p>
      ) : (
        <>
          <section className="mb-4">
            <h4 className="text-md font-semibold mb-2">Jobs:</h4>
            {jobs && jobs.length ? (
              <ul className="list-disc pl-5 text-sm text-card-foreground">
                {jobs.map((job) => (
                  <li key={job.id} className="mb-1">
                    {job.name} - {job.status} ({job.conclusion ?? "N/A"})
                    {job.html_url && (
                      <a
                        href={job.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-500 hover:underline"
                      >
                        View Job
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No jobs found.</p>
            )}
          </section>

          <section className="mb-4">
            <h4 className="text-md font-semibold mb-2">Artifacts:</h4>
            {artifacts && artifacts.length ? (
              <ul className="list-disc pl-5 text-sm text-card-foreground">
                {artifacts.map((artifact) => (
                  <li key={artifact.id} className="mb-1">
                    {artifact.name} (
                    {Intl.NumberFormat("en", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(artifact.size_in_bytes)}
                    )
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto px-2 py-1 text-blue-500 hover:text-blue-700"
                      onClick={() =>
                        window.open(
                          `/api/github${urlInsert}/workflows/artifacts/${artifact.id}/zip`,
                          "_blank"
                        )
                      }
                    >
                      Download
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No artifacts found.</p>
            )}
          </section>

          <div className="mt-4">
            <Button
              onClick={() =>
                window.open(`/api/github${urlInsert}/workflows/runs/${run.id}/logs`, "_blank")
              }
            >
              Download All Logs
            </Button>
          </div>
        </>
      )}
    </ExpandablePanel>
  );
}
