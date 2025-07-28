export const dynamic = "force-dynamic";
import ProfileMain from "../ProfileMain";
import { checkAuth } from "@/lib/helpers/checkAuth";
import { redirect } from "next/navigation";

export default async function DashboardProfile() {
  const user = await checkAuth();
  if (!user) redirect("/login");

  return (
    <div>
      <ProfileMain user={user} />
    </div>
  );
}
