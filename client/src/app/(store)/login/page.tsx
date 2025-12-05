import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { isJwtExpired } from "@/lib/helpers/isJwtExpired";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  const token = session?.idToken;
  if (token && !isJwtExpired(token)) {
    redirect("/dashboard");
  }

  redirect("/api/auth/signin/hydra?callbackUrl=/dashboard");
}
