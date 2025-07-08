export const dynamic = "force-dynamic";
import ProfileMain from "../ProfileMain";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardProfile() {
  const user = await checkAuth();

  return (
    <div>
      <h1 className="text-center text-xl font-bold">Hi, {user.username}</h1>
      <ProfileMain user={user} />
    </div>
  );
}
