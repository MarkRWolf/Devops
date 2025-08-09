import { cookies } from "next/headers";
import type { User } from "@/lib/user/user";
import { baseUrl } from "../settings";
import { redirect } from "next/navigation";

export async function checkAuth(): Promise<User | null> {
  const res = await fetch(`${baseUrl}/api/account/me`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });
  return res.ok ? (res.json() as Promise<User>) : null;
}

export async function requireAuth(): Promise<User> {
  const me = await checkAuth();
  if (!me) redirect("/login");
  return me;
}
