// client/src/app/(store)/page.tsx
export const dynamic = "force-dynamic";

import BetterLink from "@/components/BetterLink";
import { Button } from "@/components/ui/button";
import WorkflowRuns from "@/components/github/WorkflowRuns";
import { fetchWorkflowRuns } from "@/lib/github/helpers";

export default async function Home() {
  const projectWorkflowRuns = await fetchWorkflowRuns("/project");

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <h1 className="text-xl">Welcome to my Devops Dashboard</h1>

      <BetterLink href={`/login`}>
        <Button variant="outline">Login</Button>
      </BetterLink>
  
      <WorkflowRuns runs={projectWorkflowRuns} project={"/project"} />
    </div>
  );
}
