export const dynamic = "force-dynamic";
import LoginForm from "@/components/LoginForm";
import { checkAuth } from "@/lib/helpers/checkAuth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await checkAuth();
  if (user) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    redirect("/dashboard");
  }

  return (
    <main className="text-center space-y-4 py-10">
      <h1 className="text-2xl font-bold">Login</h1>
      <p>Please log in to access your dashboard.</p>
      <LoginForm />
    </main>
  );
}
