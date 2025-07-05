export const dynamic = "force-dynamic";
import UserMain from "./UserMain";
import { checkAuth } from "@/lib/helpers/checkAuth";

export default async function DashboardHome() {
  const user = await checkAuth();

  return (
    <div>
      <h1 className="text-center text-xl font-bold">Dashboard xd</h1>
      <h2>{user.username}</h2>
      <UserMain user={user} />
    </div>
  );
}
