// @/lib/helpers/UserHelpers.ts
import { User } from "@/lib/user/user";
import { headers } from "next/headers";
import { baseUrl } from "../settings";

export const checkUser = async (): Promise<User | null> => {
  const cookieHeader = (await headers()).get("cookie");

  try {
    const res = await fetch(`${baseUrl}/api/account/me`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader || "",
      },
      cache: "no-store",
    });

    return res.ok ? await res.json() : null;
  } catch (error) {
    console.error("Error calling Next.js API proxy from checkUser:", error);
    return null;
  }
};
