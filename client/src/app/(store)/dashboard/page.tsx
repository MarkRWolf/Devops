export const dynamic = "force-dynamic";
import { checkUser } from "@/lib/helpers/UserHelpers";
import UserMain from "./UserMain";

export default async function DashboardHome() {
  const user = await checkUser();

  if (!user) {
    return (
      <main className="text-center space-y-4 py-10">
        <h1 className="text-2xl font-bold">AZ Dashboard</h1>
        <p className="text-red-600">You are not logged in.</p>
      </main>
    );
  }

  return (
    <div>
      <h2>{user.userName}</h2>
      <UserMain user={user} />
    </div>
  );
}
