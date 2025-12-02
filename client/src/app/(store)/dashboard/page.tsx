export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardIndex() {
  await requireAuth();
  redirect("/dashboard/home");
}

