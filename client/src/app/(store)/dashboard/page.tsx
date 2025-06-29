export const dynamic = "force-dynamic";
import { BuildRun } from "@/types/buildRun";

export default async function Home() {
  const data: BuildRun[] = await fetch(`/api/builds`, {
    cache: "no-store",
  })
    .then((res) => res.json())
    .catch((e) => console.log("Error fetching data:", e));
  console.log("Data fetched:", data);

  return (
    <div className="flex gap-4">
      <h1 className="text-2xl font-bold mb-4">Build Runs</h1>
      {data?.map((br) => (
        <div key={br.id}>
          <h2>{br.id}</h2>
          <p>Status: {br.status}</p>
          <p>Build took: {br.duration}s</p>
          <p>Started at: {new Date(br.startedAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
