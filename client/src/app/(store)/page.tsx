export const dynamic = "force-dynamic";

import Link from "next/link";
import Demoxd from "./Demoxd";

export default async function Home() {
  return (
    <div className="text-center">
      <h1>Welcome to the page</h1>
      <Demoxd />
      <Link href="/login" className="rounded-md border-neutral-600 border-2 px-4 py-2">
        Sign up
      </Link>
    </div>
  );
}
