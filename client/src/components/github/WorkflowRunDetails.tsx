// client/src/components/WorkflowRunDetails.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GitHubWorkflowRun, GitHubJob, GitHubArtifact } from "@/lib/github/models";
import { Button } from "@/components/ui/button";

interface WorkflowRunDetailsProps {
  run: GitHubWorkflowRun;
}

const WorkflowRunDetails: React.FC<WorkflowRunDetailsProps> = ({ run }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [jobs, setJobs] = useState<GitHubJob[] | null>(null);
  const [artifacts, setArtifacts] = useState<GitHubArtifact[] | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    const newState = !isExpanded;
    setIsExpanded(newState);

    if (newState && (!jobs || !artifacts)) {
      setIsLoadingDetails(true);
      setError(null);
      try {
        const [jobsRes, artifactsRes] = await Promise.all([
          fetch(`/api/github/project/workflows/runs/${run.id}/jobs`),
          fetch(`/api/github/project/workflows/runs/${run.id}/artifacts`),
        ]);

        if (!jobsRes.ok) {
          throw new Error(`Failed to fetch jobs: ${jobsRes.status} ${await jobsRes.text()}`);
        }
        if (!artifactsRes.ok) {
          throw new Error(
            `Failed to fetch artifacts: ${artifactsRes.status} ${await artifactsRes.text()}`
          );
        }

        const jobsJson = await jobsRes.json();
        const artifactsJson = await artifactsRes.json();

        const jobsArr: GitHubJob[] = Array.isArray(jobsJson)
          ? jobsJson
          : Array.isArray(jobsJson.jobs)
          ? jobsJson.jobs
          : [];

        const artifactsArr: GitHubArtifact[] = Array.isArray(artifactsJson)
          ? artifactsJson
          : Array.isArray(artifactsJson.artifacts)
          ? artifactsJson.artifacts
          : [];

        setJobs(jobsArr);
        setArtifacts(artifactsArr);
      } catch (err: unknown) {
        console.error("Error fetching run details:", err);
        setError(err instanceof Error ? err.message : "Failed to load run details.");
        setJobs(null);
        setArtifacts(null);
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  const handleDownloadLogs = async (runId: number) => {
    try {
      const response = await fetch(`/api/github/project/workflows/runs/${runId}/logs`);
      if (response.ok) {
        window.open(response.url, "_blank");
      } else {
        alert(`Failed to download logs: ${response.status} ${await response.text()}`);
      }
    } catch (err) {
      console.error("Error downloading logs:", err);
      alert("Error downloading logs.");
    }
  };

  const handleDownloadArtifact = (artifactUrl: string) => {
    window.open(artifactUrl, "_blank");
  };

  const contentVariants = {
    closed: { opacity: 0, height: 0, overflow: "hidden" },
    open: { opacity: 1, height: "auto", overflow: "visible" },
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-center cursor-pointer" onClick={handleToggle}>
        <div>
          <h3 className="text-md font-semibold text-gray-800">{run.name}</h3>
          <p className="text-sm text-gray-600">
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
          <p className="text-xs text-gray-500">
            Run Number: {run.run_number} | Created:{" "}
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
          <span className="ml-2 text-lg font-bold">{isExpanded ? "−" : "+"}</span>
        </Button>
      </div>

      <motion.div
        initial="closed"
        animate={isExpanded ? "open" : "closed"}
        variants={contentVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            {isLoadingDetails ? (
              <p className="text-center text-gray-500">Loading details...</p>
            ) : error ? (
              <p className="text-center text-red-500">{error}</p>
            ) : (
              <>
                <h4 className="text-md font-semibold mb-2">Jobs:</h4>
                {jobs && jobs.length > 0 ? (
                  <ul className="list-disc pl-5 mb-4 text-sm text-gray-700">
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
                  <p className="text-sm text-gray-500 mb-4">No jobs found for this run.</p>
                )}

                <h4 className="text-md font-semibold mb-2">Artifacts:</h4>
                {artifacts && artifacts.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-gray-700">
                    {artifacts.map((artifact) => (
                      <li key={artifact.id} className="mb-1">
                        {artifact.name} ({(artifact.size_in_bytes / 1024).toFixed(2)} KB)
                        {artifact.archive_download_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-auto px-2 py-1 text-blue-500 hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadArtifact(artifact.archive_download_url!);
                            }}
                          >
                            Download
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No artifacts found for this run.</p>
                )}

                <div className="mt-4">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadLogs(run.id);
                    }}
                  >
                    Download All Logs
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default WorkflowRunDetails;
