export const dynamic = "force-dynamic";

import CIMetrics from "@/components/sections/CIMetrics";
import { getCiData } from "@/lib/ci/server";
import { requireAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardStats() {
  await requireAuth();
  const { workflowRuns, azureBuilds } = await getCiData("user");

  return <CIMetrics workflowRuns={workflowRuns} azureBuilds={azureBuilds} view="runs" />;
}
