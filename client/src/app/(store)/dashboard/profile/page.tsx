export const dynamic = "force-dynamic";
import DashboardNav from "@/components/dashboardNav/DashboardNav";
import ProfileMain from "../ProfileMain";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardProfile() {
  const user = await checkAuth();

  return (
    <div>
      <DashboardNav slug="/dashboard/profile" />
      <ProfileMain user={user} />
    </div>
  );
}
