import { AzureBuild } from "./models";

const fmtDate = new Intl.DateTimeFormat("da-DK", {
  timeZone: "Europe/Copenhagen",
  month: "2-digit",
  day: "2-digit",
});

export function partitionBuilds(builds: AzureBuild[]) {
  const success: AzureBuild[] = [];
  const failed: AzureBuild[] = [];

  builds.forEach((b) =>
    b.status === "completed" && b.result === "succeeded"
      ? success.push(b)
      : b.status === "completed"
      ? failed.push(b)
      : null
  );

  return { success, failed };
}

export function buildSuccessSeries(builds: AzureBuild[]) {
  const bucket = new Map<number, { ok: number; total: number }>();

  builds.forEach((b) => {
    if (b.status !== "completed") return;
    const d = new Date(b.startTime ?? b.queueTime);
    d.setUTCHours(0, 0, 0, 0);
    const key = d.getTime();

    const hit = bucket.get(key) ?? { ok: 0, total: 0 };
    hit.total++;
    if (b.result === "succeeded") hit.ok++;
    bucket.set(key, hit);
  });

  return [...bucket.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ms, { ok, total }]) => ({
      x: fmtDate.format(ms),
      y: +((ok / total) * 100).toFixed(1),
    }));
}

export function buildDurationSeries(builds: AzureBuild[]) {
  return builds
    .filter((b, i) => i < 14 && b.status === "completed" && b.finishTime)
    .map((b) => ({
      x: fmtDate.format(new Date(b.startTime ?? b.queueTime)),
      y: Date.parse(b.finishTime!) - Date.parse(b.startTime ?? b.queueTime),
    }));
}
