// @/lib/helpers/checkAuth.ts
import { cookies } from "next/headers";
import type { User } from "@/lib/user/user";

export async function checkAuth(): Promise<User | null> {
  const res = await fetch(`/api/account/me`, {
    headers: { cookie: (await cookies()).toString() },
    cache: "no-store",
  });

  return res.ok ? (res.json() as Promise<User>) : null;
}
