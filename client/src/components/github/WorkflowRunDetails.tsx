"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { GitHubWorkflowRun, GitHubJob, GitHubArtifact } from "@/lib/github/models";
import { clientBaseUrl } from "@/lib/settings";

interface WorkflowRunDetailsProps {
  run: GitHubWorkflowRun;
  urlInsert: string;
}

export default function WorkflowRunDetails({ run, urlInsert }: WorkflowRunDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<GitHubJob[] | null>(null);
  const [artifacts, setArtifacts] = useState<GitHubArtifact[] | null>(null);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const base = `${clientBaseUrl}/github${urlInsert}/workflows/runs/${run.id}`;
      const [jobsRes, artifactsRes] = await Promise.all([
        fetch(`${base}/jobs`),
        fetch(`${base}/artifacts`),
      ]);

      if (!jobsRes.ok)
        throw new Error(`Failed to fetch jobs: ${jobsRes.status} ${await jobsRes.text()}`);
      if (!artifactsRes.ok)
        throw new Error(
          `Failed to fetch artifacts: ${artifactsRes.status} ${await artifactsRes.text()}`
        );

      const jobsJson = await jobsRes.json();
      const artifactsJson = await artifactsRes.json();

      setJobs(Array.isArray(jobsJson.jobs) ? jobsJson.jobs : jobsJson);
      setArtifacts(
        Array.isArray(artifactsJson.artifacts) ? artifactsJson.artifacts : artifactsJson
      );
    } catch (err) {
      if (process.env.NODE_ENV === "development") console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load run details.");
      setJobs(null);
      setArtifacts(null);
    } finally {
      setIsLoading(false);
    }
  }, [run.id, urlInsert]);

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && jobs === null && artifacts === null) fetchDetails();
  };

  const download = (url: string) => window.open(url, "_blank");

  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm">
      <div className="flex justify-between items-center cursor-pointer" onClick={handleToggle}>
        <div>
          <h3 className="text-md font-semibold text-card-foreground">{run.name}</h3>
          <p className="text-sm text-secondary-foreground">
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
          </p>
          <p className="text-xs text-muted-foreground">
            Run #{run.run_number} •{" "}
            {new Date(run.created_at).toLocaleString("da-DK", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hourCycle: "h23",
              timeZone: "Europe/Copenhagen",
            })}
          </p>
          {run.html_url && (
            <a
              href={run.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              View on GitHub
            </a>
          )}
        </div>
        <Button variant="ghost" size="sm" className="w-auto px-2">
          {isExpanded ? "Collapse" : "Expand"}
          <span className="ml-2 text-lg font-bold">{isExpanded ? "-" : "+"}</span>
        </Button>
      </div>

      <div
        className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {isExpanded && (
          <div className="pt-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading…</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
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
                              onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              download(
                                `${clientBaseUrl}/api/github${urlInsert}/workflows/artifacts/${artifact.id}/zip`
                              );
                            }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      download(
                        `${clientBaseUrl}/api/github${urlInsert}/workflows/runs/${run.id}/logs`
                      );
                    }}
                  >
                    Download All Logs
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
