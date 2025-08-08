import { headers } from "next/headers";
import { baseUrl } from "../settings";
import { AzureBuild } from "./models";

/**
 * If `project` === "" → user-scoped (DEFAULT)
 * If `project` starts with "/project" → public project runs
 */
export const fetchAzureBuilds = async (project: string = ""): Promise<AzureBuild[]> => {
  try {
    const h = new Headers(await headers());
    const cookie = h.get("cookie");

    const res = await fetch(`${baseUrl}/api/azure${project}/builds`, {
      cache: "no-store",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });

    if (!res.ok) {
      console.error(
        `Failed to fetch ${project || "user"} Azure builds:`,
        res.status,
        await res.text()
      );
      return [];
    }

    return (await res.json()) as AzureBuild[];
  } catch (err) {
    console.error("Error fetching Azure builds:", err);
    return [];
  }
};
