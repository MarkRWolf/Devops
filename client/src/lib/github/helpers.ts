import { headers } from "next/headers";
import { baseUrl } from "../settings";
import { GitHubWorkflowRun } from "./models";

export const fetchWorkflowRuns = async (project: string = ""): Promise<GitHubWorkflowRun[]> => {
  try {
    const requestHeaders = new Headers(await headers());
    const cookie = requestHeaders.get("cookie");

    const fetchOptions: RequestInit = {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      credentials: "include",
    };
    const url = `${baseUrl}/api/github${project}/workflows/runs`;
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      console.error(
        `Failed to fetch url: - ${url} - for ${project || "User"} workflow runs:`,
        res.status,
        await res.text()
      );
      return [];
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${project || "User"} workflow runs:`, error);
    return [];
  }
};
