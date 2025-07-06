// @/lib/helpers/checkAuth.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/user/user";

export const checkAuth = async (): Promise<User> => {
  const base = process.env.SELF_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/account/me`, {
    headers: { Cookie: cookies().toString() },
    cache: "no-store",
  });

  if (!res.ok) redirect("/login");
  return (await res.json()) as User;
};
