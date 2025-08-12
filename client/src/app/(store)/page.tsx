// client/src/app/(store)/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import CIFilter from "@/components/ci/CIFilter";
import CIMetrics from "@/components/sections/CIMetrics";
import { getGitHubData, getAzureData } from "@/lib/ci/server";
import Hero from "@/components/landing/Hero";

export default async function Home({ searchParams }: { searchParams: Promise<{ ci?: string }> }) {
  // single-toggle: homepage always has both; default to gh
  const available = { gh: true, az: true } as const;
  const defaultProvider = "gh" as const;
  const ciTag = await searchParams;
  const ci = ciTag.ci === "az" ? "az" : "gh";

  const [workflowRuns, azureBuilds] =
    ci === "gh"
      ? [await getGitHubData("project"), undefined]
      : [undefined, await getAzureData("project")];

  return (
    <div className="flex flex-col items-center gap-8">
      <Hero />

      <section id="demo" className="flex flex-col items-center gap-2 mt-4 w-full">
        <h1 className="text-xl">Welcome to my Devops Dashboard</h1>
        <h2>You&apos;re currently viewing metrics for this project</h2>
        <h2>
          Login on&nbsp;
          <Link href="/login" className="underline">
            Dashboard
          </Link>
          &nbsp; to connect your own project
        </h2>

        <div className="w-full px-4 md:px-10 lg:px-20">
          <CIFilter available={available} defaultProvider={defaultProvider} />
          <CIMetrics workflowRuns={workflowRuns} azureBuilds={azureBuilds} project="/project" />
        </div>
      </section>
    </div>
  );
}
