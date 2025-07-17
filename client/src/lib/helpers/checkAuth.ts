// @/lib/helpers/checkAuth.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/user/user";
import { baseUrl } from "../settings";

export async function checkAuth(): Promise<User> {
  const res = await fetch(`${baseUrl}/api/account/me`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });

  if (!res.ok) redirect("/login");
  return res.json() as Promise<User>;
}
