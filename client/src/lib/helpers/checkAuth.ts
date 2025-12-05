import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import type { User } from "@/lib/user/user";

export async function requireAuth(): Promise<User> {
  const session = await getServerSession(authOptions);
  const baseUrl = process.env.DOTNET_API_BASE_URL;
    console.log(baseUrl);
  const token = session?.idToken;

  if (!token) {
    redirect("/");
  }

  const res = await fetch(`${baseUrl}/API/account/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/");
  }

  return res.json() as Promise<User>;
}

