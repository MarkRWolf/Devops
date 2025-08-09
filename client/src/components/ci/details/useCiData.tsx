// ./client/src/components/ci/details/useCiData.ts
"use client";

import { useCallback, useState } from "react";

export function useCiData<J, A>({
  baseUrl,
  jobsEndpoint,
  artifactsEndpoint,
  extractJobs,
  extractArtifacts,
}: {
  baseUrl: string;
  jobsEndpoint: string; // "jobs" | "timeline"
  artifactsEndpoint: string; // "artifacts"
  extractJobs: (json: unknown) => J[];
  extractArtifacts: (json: unknown) => A[];
}) {
  const [jobs, setJobs] = useState<J[] | null>(null);
  const [artifacts, setArtifacts] = useState<A[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [jobsRes, artsRes] = await Promise.all([
        fetch(`${baseUrl}/${jobsEndpoint}`, { credentials: "include" }),
        fetch(`${baseUrl}/${artifactsEndpoint}`, { credentials: "include" }),
      ]);
      if (!jobsRes.ok) throw new Error(await jobsRes.text());
      if (!artsRes.ok) throw new Error(await artsRes.text());

      const jobsJson = (await jobsRes.json()) as unknown;
      const artsJson = (await artsRes.json()) as unknown;

      setJobs(extractJobs(jobsJson));
      setArtifacts(extractArtifacts(artsJson));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load details.");
      setJobs(null);
      setArtifacts(null);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, jobsEndpoint, artifactsEndpoint, extractJobs, extractArtifacts]);

  return { jobs, artifacts, loading, err, load };
}
