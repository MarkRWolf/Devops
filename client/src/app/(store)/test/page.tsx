export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await fetch(`/api/test/ping`, {
    cache: "no-store",
  })
    .then((res) => res)
    .catch((e) => console.log("Error fetching data:", e));
  console.log("Data fetched:", data);

  return (
    <div className="flex gap-4">
      <h1 className="text-2xl font-bold mb-4">Test Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
