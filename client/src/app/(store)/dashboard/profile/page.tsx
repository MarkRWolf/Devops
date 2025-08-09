export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/helpers/checkAuth";
import ProfileMain from "./ProfileMain";

export default async function DashboardProfile() {
  const user = await requireAuth();

  return (
    <div>
      <ProfileMain user={user} />
    </div>
  );
}
