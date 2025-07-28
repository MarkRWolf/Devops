import { GitHubWorkflowRun } from "./models";

// lib/github/stats.ts
const fmtDate = new Intl.DateTimeFormat("da-DK", {
  timeZone: "Europe/Copenhagen",
  month: "2-digit",
  day: "2-digit",
}); // → DD‑MM‑YYYY

/* const fmtStamp = new Intl.DateTimeFormat("da-DK", {
  timeZone: "Europe/Copenhagen",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
}); */
// → DD‑MM‑YYYY HH:MM:SS

/* EXPORTS */

export function partitionRuns(runs: GitHubWorkflowRun[]): {
  success: GitHubWorkflowRun[];
  failed: GitHubWorkflowRun[];
} {
  const success: GitHubWorkflowRun[] = [];
  const failed: GitHubWorkflowRun[] = [];

  runs.forEach((r) =>
    r.status === "completed" && r.conclusion === "success"
      ? success.push(r)
      : r.status === "completed"
      ? failed.push(r)
      : null
  );

  return { success, failed };
}

export function buildSuccessSeries(runs: GitHubWorkflowRun[]) {
  const bucket = new Map<number, { ok: number; total: number }>();

  runs.forEach((r) => {
    if (r.status !== "completed") return;
    const local = new Date(r.created_at); // parse ISO
    // normalise to Copenhagen midnight
    local.setUTCHours(0, 0, 0, 0);
    const key = local.getTime();

    const hit = bucket.get(key) ?? { ok: 0, total: 0 };
    hit.total++;
    if (r.conclusion === "success") hit.ok++;
    bucket.set(key, hit);
  });

  return [...bucket.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ms, { ok, total }]) => ({
      x: fmtDate.format(ms), // DD‑MM‑YYYY label
      y: +((ok / total) * 100).toFixed(1), // success %
    }));
}

export function buildDurationSeries(runs: GitHubWorkflowRun[]) {
  return runs
    .filter((r, i) => i < 14 && r.status === "completed")
    .map((r) => ({
      x: fmtDate.format(new Date(r.created_at)),
      y: Date.parse(r.updated_at) - Date.parse(r.created_at), // ms
    }));
}
