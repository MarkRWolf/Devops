import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { User } from "@/lib/user/user";
import { authOptions } from "@/auth";
import { baseUrl } from "../settings";

export async function checkAuth(): Promise<User | null> {
  const session = await getServerSession(authOptions);

  const headers: HeadersInit = {
    cookie: (await cookies()).toString(),
  };

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const res = await fetch(`${baseUrl}/api/account/me`, {
    headers,
    cache: "no-store",
  });

  return res.ok ? (res.json() as Promise<User>) : null;
}

export async function requireAuth(): Promise<User> {
  const me = await checkAuth();
  if (!me) redirect("/login");
  return me;
}

