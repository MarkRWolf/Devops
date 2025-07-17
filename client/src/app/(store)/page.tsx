// client/src/app/(store)/page.tsx
export const dynamic = "force-dynamic";

import BetterLink from "@/components/BetterLink";
import { Button } from "@/components/ui/button";
import { baseUrl } from "@/lib/settings";
import { GitHubWorkflowRun } from "@/lib/github/models";
import WorkflowRunDetails from "@/components/github/WorkflowRunDetails";

export default async function Home() {
  const fetchProjectWorkflowRuns = async (): Promise<GitHubWorkflowRun[]> => {
    try {
      const res = await fetch(`${baseUrl}/api/github/project/workflows/runs`, {
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Failed to fetch project workflow runs:", res.status, await res.text());
        return [];
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching project workflow runs:", error);
      return [];
    }
  };

  const projectWorkflowRuns = await fetchProjectWorkflowRuns();

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <h1 className="text-xl">Welcome to my Devops Dashboard</h1>

      {projectWorkflowRuns.length > 0 && (
        <div className="mt-4 w-full max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">Latest Project Workflow Runs:</h2>
          <ul className="space-y-4">
            {projectWorkflowRuns.map((run) => (
              <li key={run.id} className="border p-4 rounded-lg shadow-sm bg-white">
                <WorkflowRunDetails run={run} />
              </li>
            ))}
          </ul>
        </div>
      )}
      {projectWorkflowRuns.length === 0 && (
        <p>
          No project workflow runs found or configured. Ensure your Kestrel backend has
          `GitHub:ProjectOwnerRepo` and `GitHub:ProjectPat` configured.
        </p>
      )}

      <BetterLink href="/login">
        <Button variant="outline">Login</Button>
      </BetterLink>
    </div>
  );
}
