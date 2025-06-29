export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import Demoxd from "./Demoxd";

export default async function Home() {
  const data = await fetch(`/api/hello`, { cache: "no-store" })
    .then((res) => res.json())
    .then((d) => d.data)
    .catch((e) => console.log("Error fetching data:", e));
  console.log("Data fetched:", data);
  return (
    <div className="text-center">
      <h1>Welcome to the page</h1>
      <Link href="dashboard">
        <Button variant={"outline"} className="cursor-pointer">
          Dashboard
        </Button>
      </Link>
      {data && <p>{data}</p>}
      <Demoxd />
    </div>
  );
}
