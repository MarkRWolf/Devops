import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.idToken) {
    redirect("/dashboard");
  }

  redirect("/api/auth/signin/hydra?callbackUrl=/dashboard");
}
