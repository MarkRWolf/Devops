export const dynamic = "force-dynamic";
import LoginForm from "@/components/LoginForm";
import { checkUser } from "@/lib/helpers/UserHelpers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await checkUser();
  if (user) redirect("/dashboard");

  return (
    <main className="text-center space-y-4 py-10">
      <h1 className="text-2xl font-bold">Login</h1>
      <p>Please log in to access your dashboard.</p>
      {/* Add your login form here */}
      <LoginForm />
    </main>
  );
}
