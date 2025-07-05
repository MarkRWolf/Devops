// @/lib/helpers/UserHelpers.ts
import { User } from "@/lib/user/user";
import { headers } from "next/headers";
// REMOVED: import { redirect } from "next/navigation";

export const checkUser = async (): Promise<User | null> => {
  const baseUrl = process.env.SELF_URL;

  if (!baseUrl) {
    console.error(
      "Application configuration error: SELF_URL environment variable is not set for checkUser."
    );
    return null; // Return null if config is missing
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
      return null; // NO REDIRECT. Just return null for unauthorized.
    }
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Error from Next.js proxy route (${res.status} ${res.statusText}): ${errorText}`
      );
      return null; // NO REDIRECT. Return null for other non-OK responses.
    }

    return (await res.json()) as User;
  } catch (error) {
    console.error("Error calling Next.js API proxy from checkUser:", error);
    return null; // NO REDIRECT. Return null on network errors.
  }
};
