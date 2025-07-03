// @/lib/helpers/checkAuth.ts
import { User } from "@/lib/user/user";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const checkAuth = async (): Promise<User> => {
  const baseUrl = process.env.SELF_URL;

  if (!baseUrl) {
    throw new Error("Application configuration error: SELF_URL environment variable is not set.");
  }

  const cookieHeader = (await headers()).get("cookie");

  try {
    const res = await fetch(`${baseUrl}/api/account/me`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader || "",
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      redirect("/login");
    }
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Error from Next.js proxy route (${res.status} ${res.statusText}): ${errorText}`
      );
      redirect("/login");
    }

    return (await res.json()) as User;
  } catch (error) {
    console.error("Error calling Next.js API proxy from checkAuth:", error);
    redirect("/login");
  }
};
